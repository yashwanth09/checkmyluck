import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GroupStatus, PaymentStatus } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

const joinSchema = {
  groupId: (v: unknown) => typeof v === "string" && v.length > 0,
  mobileNumber: (v: unknown) =>
    typeof v === "string" && /^[6-9]\d{9}$/.test(v.replace(/\s/g, "")),
  address: (v: unknown) => typeof v === "string" && v.trim().length >= 10,
  // bidCount removed: only one bid per user now
  age: (v: unknown) => {
    const n = Number(v);
    return Number.isInteger(n) && n >= 1 && n <= 120;
  },
  gender: (v: unknown) =>
    typeof v === "string" && ["MALE", "FEMALE", "OTHER"].includes(v),
  selectedCriterionId: (v: unknown) =>
    v == null || (typeof v === "string" && v.length > 0),
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      groupId,
      mobileNumber,
      address,
      displayName,
      age: rawAge,
      gender,
      selectedCriterionId,
      mode,
    } = body;
    const name = typeof displayName === "string" ? displayName.trim() || null : null;
    const paymentMode = mode === "REAL" ? "REAL" : "VIRTUAL";
    const isVirtual = paymentMode === "VIRTUAL";

    if (
      !joinSchema.groupId(groupId) ||
      !joinSchema.mobileNumber(mobileNumber) ||
      !joinSchema.address(address)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid input. Mobile: 10 digits, Address: min 10 chars",
        },
        { status: 400 }
      );
    }

    const mobile = mobileNumber.replace(/\s/g, "").trim();

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        _count: { select: { members: true } },
        criteria: { orderBy: { order: "asc" } },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const nowTime = new Date();
    if (nowTime > group.closesAt) {
      // Time's up – auto-cancel if not already closed/done
      if (
        group.status === GroupStatus.OPEN ||
        group.status === GroupStatus.FULL
      ) {
        await prisma.group.update({
          where: { id: groupId },
          data: { status: GroupStatus.CANCELLED },
        });
      }
      return NextResponse.json(
        { error: "Time's up. This group is dissolved." },
        { status: 400 }
      );
    }

    if (group.status !== GroupStatus.OPEN) {
      return NextResponse.json(
        { error: "Group is no longer accepting members" },
        { status: 400 }
      );
    }

    if (group._count.members >= group.maxMembers) {
      return NextResponse.json(
        { error: "Group is full" },
        { status: 400 }
      );
    }

    const hasCriteria = group.criteria.length > 0;
    if (hasCriteria) {
      if (!joinSchema.age(rawAge) || !joinSchema.gender(gender)) {
        return NextResponse.json(
          { error: "Age (1-120) and gender (MALE/FEMALE/OTHER) required when group has winning criteria" },
          { status: 400 }
        );
      }
      if (!joinSchema.selectedCriterionId(selectedCriterionId) || !selectedCriterionId) {
        return NextResponse.json(
          { error: "Please select a winning criterion" },
          { status: 400 }
        );
      }
      const criterionBelongs = group.criteria.some((c) => c.id === selectedCriterionId);
      if (!criterionBelongs) {
        return NextResponse.json(
          { error: "Invalid winning criterion" },
          { status: 400 }
        );
      }
    }
    const age = hasCriteria && joinSchema.age(rawAge) ? Number(rawAge) : null;
    const genderVal = hasCriteria && joinSchema.gender(gender) ? gender : null;
    const criterionId = hasCriteria && selectedCriterionId ? selectedCriterionId : null;

    // Max bids per person (by mobile in this group)
    const existing = await prisma.member.findUnique({
      where: {
        groupId_mobileNumber: { groupId, mobileNumber: mobile },
      },
    });

    if (existing) {
      // Only one bid per user per group
      return NextResponse.json(
        { error: "You already joined this group with this mobile number." },
        { status: 400 }
      );
    }

    const totalAmount = group.entryFee;
    const member = await prisma.member.create({
      data: {
        groupId,
        mobileNumber: mobile,
        address: address.trim(),
        displayName: name ?? undefined,
        bidCount: 1,
        totalAmount,
        age: age ?? undefined,
        gender: genderVal ?? undefined,
        selectedCriterionId: criterionId ?? undefined,
      },
    });

    const payment = await prisma.payment.create({
      data: {
        memberId: member.id,
        groupId,
        amount: totalAmount,
        referenceId: `${isVirtual ? "VIRT" : "CML"}-${uuidv4()
          .slice(0, 8)
          .toUpperCase()}`,
        ...(isVirtual && { status: PaymentStatus.CONFIRMED }),
      },
    });

    return NextResponse.json({
      success: true,
      memberId: member.id,
      paymentId: payment.id,
      referenceId: payment.referenceId,
      amount: totalAmount,
      totalBids: 1,
      virtual: isVirtual,
      paymentStatus: payment.status,
      message: isVirtual
        ? "Joined with virtual money."
        : "Joined! Complete payment to confirm.",
    });
  } catch (error) {
    console.error("POST /api/join:", error);
    return NextResponse.json(
      { error: "Failed to join group" },
      { status: 500 }
    );
  }
}
