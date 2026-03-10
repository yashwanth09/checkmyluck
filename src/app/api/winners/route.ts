import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GroupStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

function maskMobile(mobile: string): string {
  if (mobile.length < 4) return "****";
  return mobile.slice(0, 2) + "****" + mobile.slice(-2);
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const days = Math.min(7, Math.max(1, parseInt(searchParams.get("days") || "3", 10)));

    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    const groups = await prisma.group.findMany({
      where: {
        status: GroupStatus.DRAW_DONE,
        drawDoneAt: { gte: since },
      },
      include: {
        winner: true,
        members: {
          where: { isWinner: true },
          select: { displayName: true, mobileNumber: true, totalAmount: true },
        },
      },
      orderBy: { drawDoneAt: "desc" },
      take: 10,
    });

    const winners = groups.map((g) => {
      const winnerMembers = g.members.length > 0
        ? g.members
        : g.winner
          ? [{ displayName: g.winner.displayName, mobileNumber: g.winner.mobileNumber }]
          : [];
      return {
        groupName: g.name,
        drawDoneAt: g.drawDoneAt?.toISOString(),
        winners: winnerMembers.map((m) => ({
        winnerName: (m.displayName?.trim() || null) as string | null,
        winnerMobileMasked: maskMobile(m.mobileNumber),
        winAmount: m.totalAmount * 2,
        })),
      };
    }).filter((w) => w.winners.length > 0);

    return NextResponse.json({ winners });
  } catch (error) {
    console.error("GET /api/winners:", error);
    return NextResponse.json(
      { error: "Failed to fetch winners" },
      { status: 500 }
    );
  }
}
