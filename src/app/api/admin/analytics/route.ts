import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GroupStatus } from "@prisma/client";
import { isAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

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
      // Refund = full amount collected when group is cancelled (per-group amounts vary)
      const refundAmount = g.status === GroupStatus.CANCELLED ? collection : 0;

      let income = 0;
      if (g.status === GroupStatus.CANCELLED) {
        income = 0; // full refund
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
        refundAmount,
        income,
      };
    });

    return NextResponse.json({
      summary: {
        totalIncome,
        todayIncome,
        incomeFromDraws,
        incomeFromCancelled,
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
