import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GroupStatus } from "@prisma/client";
import { isAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

/**
 * Returns all members who paid (CONFIRMED) in CANCELLED groups — these need refunds.
 * Amount = sum of CONFIRMED payments for that member in that group.
 */
export async function GET(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const cancelledGroups = await prisma.group.findMany({
      where: { status: GroupStatus.CANCELLED },
      include: {
        members: {
          include: {
            payments: {
              where: { status: "CONFIRMED" },
              select: { amount: true, payerUpiId: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const rows: Array<{
      groupId: string;
      groupName: string;
      memberId: string;
      mobileNumber: string;
      displayName: string | null;
      amountToRefund: number;
      payerUpiId: string | null;
    }> = [];

    for (const g of cancelledGroups) {
      for (const m of g.members) {
        const amountToRefund = m.payments.reduce((s, p) => s + p.amount, 0);
        if (amountToRefund <= 0) continue;
        const payerUpiId =
          m.payments.find((p) => p.payerUpiId)?.payerUpiId ?? null;
        rows.push({
          groupId: g.id,
          groupName: g.name,
          memberId: m.id,
          mobileNumber: m.mobileNumber,
          displayName: m.displayName,
          amountToRefund,
          payerUpiId,
        });
      }
    }

    const totalRefund = rows.reduce((s, r) => s + r.amountToRefund, 0);

    return NextResponse.json({
      rows,
      totalRefund,
      groupCount: cancelledGroups.length,
    });
  } catch (error) {
    console.error("GET /api/admin/refunds:", error);
    return NextResponse.json(
      { error: "Failed to fetch refund list" },
      { status: 500 }
    );
  }
}
