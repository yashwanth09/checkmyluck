import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GroupStatus } from "@prisma/client";
import { isAdmin } from "@/lib/admin-auth";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id: groupId } = await params;
    const body = await req.json().catch(() => ({}));
    const count = Math.min(
      Math.max(1, Math.round(Number(body.count) || 1)),
      500
    );

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      select: {
        id: true,
        entryFee: true,
        maxMembers: true,
        status: true,
        _count: { select: { members: true } },
        criteria: { orderBy: { order: "asc" }, select: { id: true } },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (group.status !== GroupStatus.OPEN && group.status !== GroupStatus.FULL) {
      return NextResponse.json(
        { error: "Group is not open for new members" },
        { status: 400 }
      );
    }

    const slotsLeft = group.maxMembers - group._count.members;
    const toAdd = Math.min(count, slotsLeft);
    if (toAdd <= 0) {
      return NextResponse.json(
        { error: "Group is already full" },
        { status: 400 }
      );
    }

    const entryFee = group.entryFee;
    const criteriaIds = group.criteria.map((c) => c.id);
    const genders = ["MALE", "FEMALE"] as const;
    const created: string[] = [];
    const botNames = [
      "Rahul",
      "Priya",
      "Amit",
      "Neha",
      "Vikram",
      "Anjali",
      "Rohan",
      "Sonal",
      "Karan",
      "Pooja",
    ];
    let displayIndex = group._count.members + 1;

    for (let i = 0; i < toAdd; i++) {
      const unique = `bot-${randomBytes(4).toString("hex")}-${Date.now()}-${i}`;
      const botCriterionId =
        criteriaIds.length > 0
          ? criteriaIds[Math.floor(Math.random() * criteriaIds.length)]
          : null;
      const displayName = botNames[(displayIndex - 1) % botNames.length];
      const member = await prisma.member.create({
        data: {
          groupId,
          mobileNumber: unique,
          displayName,
          address: "Virtual participant",
          bidCount: 1,
          totalAmount: entryFee,
          paymentStatus: "CONFIRMED",
          isBot: true,
          age: 25 + Math.floor(Math.random() * 31),
          gender: genders[Math.floor(Math.random() * 2)],
          selectedCriterionId: botCriterionId ?? undefined,
        },
      });
      created.push(member.id);
      displayIndex++;
    }

    return NextResponse.json({
      success: true,
      added: toAdd,
      message: `Added ${toAdd} bot(s) to the group.`,
    });
  } catch (error) {
    console.error("POST /api/admin/groups/[id]/bots:", error);
    return NextResponse.json(
      { error: "Failed to add bots" },
      { status: 500 }
    );
  }
}
