import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GroupStatus } from "@prisma/client";
import { MAX_GROUPS_PER_DAY } from "@/lib/constants";
import { isAdmin } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

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
      maxMembers: g.maxMembers,
      closesAt: g.closesAt.toISOString(),
      createdAt: g.createdAt.toISOString(),
      memberCount: g._count.members,
      totalCollection: g.payments.reduce((s, p) => s + p.amount, 0),
      slotsLeft: g.maxMembers - g._count.members,
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
    const {
      name,
      maxMembers: rawSlots,
      entryFee: rawFee,
      durationMinutes: rawDuration,
      criteria: rawCriteria,
    } = body;

    if (!name || typeof name !== "string" || name.trim().length < 3) {
      return NextResponse.json(
        { error: "Group name required (min 3 chars)" },
        { status: 400 }
      );
    }

    const maxMembers =
      rawSlots != null && Number.isFinite(Number(rawSlots))
        ? Math.round(Number(rawSlots))
        : 10;
    if (maxMembers < 2 || maxMembers > 10000) {
      return NextResponse.json(
        { error: "Max users must be between 2 and 10000" },
        { status: 400 }
      );
    }

    const entryFee =
      rawFee != null && Number.isFinite(Number(rawFee)) ? Math.round(Number(rawFee)) : 20;
    if (entryFee < 1 || entryFee > 100000) {
      return NextResponse.json(
        { error: "Bid amount must be between 1 and 100000" },
        { status: 400 }
      );
    }

    const durationMinutes =
      rawDuration != null && Number.isFinite(Number(rawDuration))
        ? Math.round(Number(rawDuration))
        : 10;
    if (durationMinutes < 1 || durationMinutes > 10080) {
      return NextResponse.json(
        { error: "Duration must be between 1 and 10080 minutes (1 week)" },
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

    const now = new Date();
    const closesAt = new Date(now.getTime() + durationMinutes * 60 * 1000);

    const criteriaList = Array.isArray(rawCriteria)
      ? rawCriteria
      : [];
    const validTypes = ["age_above", "age_below", "majority_male", "majority_female"];
    const criteriaData = criteriaList
      .filter(
        (c: { label?: string; type?: string; value?: number }) =>
          c && typeof c.label === "string" && c.label.trim().length > 0 && validTypes.includes(String(c.type))
      )
      .map((c: { label: string; type: string; value?: number }, i: number) => ({
        label: c.label.trim(),
        type: c.type,
        value: c.type?.startsWith("age_") && Number.isFinite(Number(c.value)) ? Number(c.value) : null,
        order: i,
      }));

    const group = await prisma.group.create({
      data: {
        name: name.trim(),
        maxMembers,
        entryFee,
        closesAt,
        criteria: criteriaData.length
          ? { create: criteriaData }
          : undefined,
      },
      include: { criteria: true },
    });

    return NextResponse.json({
      success: true,
      group: {
        ...group,
        closesAt: group.closesAt.toISOString(),
        criteria: group.criteria.map((c) => ({
          id: c.id,
          label: c.label,
          type: c.type,
          value: c.value,
          order: c.order,
        })),
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
