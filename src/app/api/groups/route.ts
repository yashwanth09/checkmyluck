import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GroupStatus } from "@prisma/client";

// Cache for 60s to handle high traffic (e.g. 5000 users/day) without overloading DB
export const revalidate = 60;

export async function GET() {
  try {
    const now = new Date();
    const groups = await prisma.group.findMany({
      where: {
        status: { in: [GroupStatus.OPEN, GroupStatus.FULL] },
        closesAt: { gt: now },
      },
      include: {
        _count: { select: { members: true } },
        members: {
          take: 5,
          orderBy: { joinedAt: "desc" },
          select: { displayName: true, joinedAt: true, bidCount: true },
        },
      },
      orderBy: { closesAt: "asc" },
    });

    return NextResponse.json(
      groups.map((g) => ({
        id: g.id,
        name: g.name,
        maxMembers: g.maxMembers,
        entryFee: g.entryFee,
        status: g.status,
        closesAt: g.closesAt.toISOString(),
        memberCount: g._count.members,
        slotsLeft: g.maxMembers - g._count.members,
        recentJoins: g.members.map((m) => ({
          displayName: m.displayName?.trim() || "A member",
          joinedAt: m.joinedAt.toISOString(),
          bidCount: m.bidCount,
        })),
      }))
    );
  } catch (error) {
    console.error("GET /api/groups:", error);
    return NextResponse.json(
      { error: "Failed to fetch groups" },
      { status: 500 }
    );
  }
}
