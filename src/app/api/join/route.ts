import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GroupStatus } from "@prisma/client";
import { MAX_BIDS_PER_MEMBER, ENTRY_FEE } from "@/lib/constants";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

const joinSchema = {
  groupId: (v: unknown) => typeof v === "string" && v.length > 0,
  mobileNumber: (v: unknown) =>
    typeof v === "string" && /^[6-9]\d{9}$/.test(v.replace(/\s/g, "")),
  address: (v: unknown) => typeof v === "string" && v.trim().length >= 10,
  bidCount: (v: unknown) => {
    const n = Number(v);
    return Number.isInteger(n) && n >= 1 && n <= MAX_BIDS_PER_MEMBER;
  },
};

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { groupId, mobileNumber, address, bidCount, displayName } = body;
    const name = typeof displayName === "string" ? displayName.trim() || null : null;

    if (
      !joinSchema.groupId(groupId) ||
      !joinSchema.mobileNumber(mobileNumber) ||
      !joinSchema.address(address) ||
      !joinSchema.bidCount(bidCount)
    ) {
      return NextResponse.json(
        {
          error:
            "Invalid input. Mobile: 10 digits, Address: min 10 chars, Bids: 1-10",
        },
        { status: 400 }
      );
    }

    const mobile = mobileNumber.replace(/\s/g, "").trim();

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { _count: { select: { members: true } } },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
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

    // Max bids per person (by mobile in this group)
    const existing = await prisma.member.findUnique({
      where: {
        groupId_mobileNumber: { groupId, mobileNumber: mobile },
      },
    });

    if (existing) {
      const newBidCount = existing.bidCount + bidCount;
      if (newBidCount > MAX_BIDS_PER_MEMBER) {
        return NextResponse.json(
          {
            error: `You already have ${existing.bidCount} bid(s). Max ${MAX_BIDS_PER_MEMBER} per person.`,
          },
          { status: 400 }
        );
      }

      const totalAmount = newBidCount * ENTRY_FEE;
      await prisma.member.update({
        where: { id: existing.id },
        data: {
          bidCount: newBidCount,
          totalAmount,
          address: address.trim(),
          ...(name !== null && { displayName: name }),
        },
      });

      const payment = await prisma.payment.create({
        data: {
          memberId: existing.id,
          groupId,
          amount: bidCount * ENTRY_FEE,
          referenceId: `CML-${uuidv4().slice(0, 8).toUpperCase()}`,
        },
      });

      return NextResponse.json({
        success: true,
        memberId: existing.id,
        paymentId: payment.id,
        referenceId: payment.referenceId,
        amount: bidCount * ENTRY_FEE,
        totalBids: newBidCount,
        message: "Bids added. Complete payment to confirm.",
      });
    }

    const totalAmount = bidCount * ENTRY_FEE;
    const member = await prisma.member.create({
      data: {
        groupId,
        mobileNumber: mobile,
        address: address.trim(),
        displayName: name ?? undefined,
        bidCount,
        totalAmount,
      },
    });

    const payment = await prisma.payment.create({
      data: {
        memberId: member.id,
        groupId,
        amount: totalAmount,
        referenceId: `CML-${uuidv4().slice(0, 8).toUpperCase()}`,
      },
    });

    return NextResponse.json({
      success: true,
      memberId: member.id,
      paymentId: payment.id,
      referenceId: payment.referenceId,
      amount: totalAmount,
      totalBids: bidCount,
      message: "Joined! Complete payment to confirm.",
    });
  } catch (error) {
    console.error("POST /api/join:", error);
    return NextResponse.json(
      { error: "Failed to join group" },
      { status: 500 }
    );
  }
}
