import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { isAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date") || new Date().toISOString().slice(0, 10);

    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);

    const [groups, payments, membersCount] = await Promise.all([
      prisma.group.findMany({
        where: { createdAt: { gte: d, lt: next } },
        include: { _count: { select: { members: true } } },
      }),
      prisma.payment.findMany({
        where: { createdAt: { gte: d, lt: next } },
      }),
      prisma.member.count({
        where: { joinedAt: { gte: d, lt: next } },
      }),
    ]);

    const totalCollection = payments
      .filter((p) => p.status === "CONFIRMED")
      .reduce((s, p) => s + p.amount, 0);
    const totalPending = payments
      .filter((p) => p.status === "PENDING")
      .reduce((s, p) => s + p.amount, 0);

    return NextResponse.json({
      date,
      groupsCount: groups.length,
      membersCount,
      totalCollection,
      totalPending,
      totalExpected: payments.reduce((s, p) => s + p.amount, 0),
      groups: groups.map((g) => ({
        id: g.id,
        name: g.name,
        memberCount: g._count.members,
        status: g.status,
      })),
    });
  } catch (error) {
    console.error("GET /api/admin/summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch summary" },
      { status: 500 }
    );
  }
}
