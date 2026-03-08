import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ADMIN_SECRET } from "@/lib/constants";

export const dynamic = "force-dynamic";

function isAdmin(req: Request): boolean {
  return req.headers.get("x-admin-secret") === ADMIN_SECRET;
}

export async function GET(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const groupId = searchParams.get("groupId");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.createdAt = { gte: d, lt: next };
    }
    if (groupId) where.groupId = groupId;
    if (status) where.status = status;

    const payments = await prisma.payment.findMany({
      where,
      include: {
        member: true,
        group: true,
      },
      orderBy: { createdAt: "desc" },
    });

    const totalPending = payments
      .filter((p) => p.status === "PENDING")
      .reduce((s, p) => s + p.amount, 0);
    const totalConfirmed = payments
      .filter((p) => p.status === "CONFIRMED")
      .reduce((s, p) => s + p.amount, 0);

    return NextResponse.json({
      payments: payments.map((p) => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        confirmedAt: p.confirmedAt?.toISOString(),
      })),
      summary: {
        totalPending,
        totalConfirmed,
        totalCollection: totalPending + totalConfirmed,
        count: payments.length,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/payments:", error);
    return NextResponse.json(
      { error: "Failed to fetch payments" },
      { status: 500 }
    );
  }
}
