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
        winnerId: { not: null },
        drawDoneAt: { gte: since },
      },
      include: {
        winner: true,
      },
      orderBy: { drawDoneAt: "desc" },
      take: 10,
    });

    const winners = groups
      .filter((g) => g.winner)
      .map((g) => ({
        groupName: g.name,
        drawDoneAt: g.drawDoneAt?.toISOString(),
        winnerName: (g.winner!.displayName?.trim() || null) as string | null,
        winnerMobileMasked: maskMobile(g.winner!.mobileNumber),
      }));

    return NextResponse.json({ winners });
  } catch (error) {
    console.error("GET /api/winners:", error);
    return NextResponse.json(
      { error: "Failed to fetch winners" },
      { status: 500 }
    );
  }
}
