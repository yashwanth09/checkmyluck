import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GroupStatus } from "@prisma/client";
import { ENTRY_FEE, REFUND_AMOUNT } from "@/lib/constants";
import { isAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

const RETAINED_PER_REFUND = ENTRY_FEE - REFUND_AMOUNT; // 10

export async function GET(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const groups = await prisma.group.findMany({
      include: {
        _count: { select: { members: true } },
        payments: {
          where: { status: "CONFIRMED" },
          select: { amount: true, memberId: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    let totalIncome = 0;
    let todayIncome = 0;
    let incomeFromDraws = 0;
    let incomeFromCancelled = 0;

    const groupRows = groups.map((g) => {
      const collection = g.payments.reduce((s, p) => s + p.amount, 0);
      const paidMemberIds = new Set(g.payments.map((p) => p.memberId));
      const refundCount = paidMemberIds.size;
      const refundAmount = refundCount * REFUND_AMOUNT;

      let income = 0;
      if (g.status === GroupStatus.CANCELLED) {
        income = refundCount * RETAINED_PER_REFUND; // 10 per person
        incomeFromCancelled += income;
      } else if (g.status === GroupStatus.CLOSED || g.status === GroupStatus.DRAW_DONE) {
        income = collection;
        incomeFromDraws += income;
      }
      // OPEN / FULL: income = 0 until settled

      totalIncome += income;
      if (g.createdAt >= todayStart) todayIncome += income;

      return {
        id: g.id,
        name: g.name,
        status: g.status,
        createdAt: g.createdAt.toISOString(),
        collection,
        refundCount: g.status === GroupStatus.CANCELLED ? refundCount : 0,
        refundAmount: g.status === GroupStatus.CANCELLED ? refundAmount : 0,
        income,
      };
    });

    return NextResponse.json({
      summary: {
        totalIncome,
        todayIncome,
        incomeFromDraws,
        incomeFromCancelled,
        targetPerGroup: 5000,
        groupCount: groupRows.length,
      },
      groups: groupRows,
    });
  } catch (error) {
    console.error("GET /api/admin/analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
