import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GroupStatus } from "@prisma/client";
import {
  MAX_GROUPS_PER_DAY,
  MAX_MEMBERS_PER_GROUP,
  ENTRY_FEE,
  GROUP_CLOSE_HOUR,
  GROUP_CLOSE_MINUTE,
} from "@/lib/constants";
import { ADMIN_SECRET } from "@/lib/constants";

export const dynamic = "force-dynamic";

function isAdmin(req: Request): boolean {
  const secret = req.headers.get("x-admin-secret");
  return secret === ADMIN_SECRET;
}

export async function GET(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    if (date) {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      const next = new Date(d);
      next.setDate(next.getDate() + 1);
      where.createdAt = { gte: d, lt: next };
    }
    if (status) {
      where.status = status;
    }

    const groups = await prisma.group.findMany({
      where,
      include: {
        _count: { select: { members: true } },
        payments: {
          where: { status: "CONFIRMED" },
          select: { amount: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const withStats = groups.map((g) => ({
      id: g.id,
      name: g.name,
      status: g.status,
      closesAt: g.closesAt.toISOString(),
      createdAt: g.createdAt.toISOString(),
      memberCount: g._count.members,
      totalCollection: g.payments.reduce((s, p) => s + p.amount, 0),
      slotsLeft: MAX_MEMBERS_PER_GROUP - g._count.members,
    }));

    return NextResponse.json(withStats);
  } catch (error) {
    console.error("GET /api/admin/groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const body = await req.json();
    const { name } = body;

    if (!name || typeof name !== "string" || name.trim().length < 3) {
      return NextResponse.json(
        { error: "Group name required (min 3 chars)" },
        { status: 400 }
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const countToday = await prisma.group.count({
      where: { createdAt: { gte: today, lt: tomorrow } },
    });

    if (countToday >= MAX_GROUPS_PER_DAY) {
      return NextResponse.json(
        { error: `Maximum ${MAX_GROUPS_PER_DAY} groups per day reached` },
        { status: 400 }
      );
    }

    const closesAt = new Date(today);
    closesAt.setHours(GROUP_CLOSE_HOUR, GROUP_CLOSE_MINUTE, 0, 0);
    if (closesAt <= new Date()) {
      closesAt.setDate(closesAt.getDate() + 1);
    }

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        maxMembers: MAX_MEMBERS_PER_GROUP,
        entryFee: ENTRY_FEE,
        closesAt,
      },
    });

    return NextResponse.json({
      success: true,
      group: {
        ...group,
        closesAt: group.closesAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("POST /api/admin/groups:", error);
    return NextResponse.json(
      { error: "Failed to create group" },
      { status: 500 }
    );
  }
}
