import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GroupStatus } from "@prisma/client";
import { isAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

// Manually run draw for a single group from admin.
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        _count: { select: { members: true } },
        criteria: { orderBy: { order: "asc" } },
        members: {
          where: { paymentStatus: "CONFIRMED" },
          include: {
            user: { select: { state: true } },
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    if (
      group.status === GroupStatus.CANCELLED ||
      group.status === GroupStatus.DRAW_DONE
    ) {
      return NextResponse.json(
        { error: "Group is already cancelled or draw is done" },
        { status: 400 }
      );
    }

    if (group._count.members <= 0) {
      return NextResponse.json(
        { error: "No confirmed members to run draw" },
        { status: 400 }
      );
    }

    const paid = group.members;
    const n = paid.length;

    const winningCriterionIds: string[] = [];

    if (group.criteria.length > 0) {
      for (const c of group.criteria) {
        let matches = false;
        if (c.type === "age_above" && c.value != null) {
          const count = paid.filter(
            (m) => m.age != null && m.age > c.value!
          ).length;
          matches = count > n / 2;
        } else if (c.type === "age_below" && c.value != null) {
          const count = paid.filter(
            (m) => m.age != null && m.age < c.value!
          ).length;
          matches = count > n / 2;
        } else if (c.type === "majority_male") {
          const count = paid.filter((m) => m.gender === "MALE").length;
          matches = count > n / 2;
        } else if (c.type === "majority_female") {
          const count = paid.filter((m) => m.gender === "FEMALE").length;
          matches = count > n / 2;
        } else if (c.type === "majority_state" && c.valueStr) {
          const count = paid.filter(
            (m) => m.user?.state != null && m.user.state === c.valueStr
          ).length;
          matches = count > n / 2;
        }
        if (matches) winningCriterionIds.push(c.id);
      }
    }

    let winnerId: string | null = null;

    if (group.criteria.length > 0 && winningCriterionIds.length > 0) {
      await prisma.member.updateMany({
        where: {
          groupId: group.id,
          selectedCriterionId: { in: winningCriterionIds },
          paymentStatus: "CONFIRMED",
        },
        data: { isWinner: true },
      });
      const firstWinner = paid.find((m) =>
        winningCriterionIds.includes(m.selectedCriterionId!)
      );
      if (firstWinner) winnerId = firstWinner.id;
    } else if (group.criteria.length === 0 && paid.length > 0) {
      const winner = paid[Math.floor(Math.random() * n)]!;
      await prisma.member.update({
        where: { id: winner.id },
        data: { isWinner: true },
      });
      winnerId = winner.id;
    }

    await prisma.group.update({
      where: { id: group.id },
      data: {
        status: GroupStatus.DRAW_DONE,
        drawDoneAt: new Date(),
        winnerId,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/admin/groups/[id]/draw:", error);
    return NextResponse.json(
      { error: "Failed to run draw" },
      { status: 500 }
    );
  }
}

