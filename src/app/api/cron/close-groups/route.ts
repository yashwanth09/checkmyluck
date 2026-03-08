import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GroupStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// Call this via cron at 7:01 PM daily. Closes due groups:
// - Full (memberCount >= maxMembers) → CLOSED (eligible for draw)
// - Not full → CANCELLED (refund everyone; no draw)
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const due = await prisma.group.findMany({
      where: {
        status: { in: [GroupStatus.OPEN, GroupStatus.FULL] },
        closesAt: { lte: now },
      },
      include: { _count: { select: { members: true } } },
    });

    let closed = 0;
    let cancelled = 0;
    for (const g of due) {
      const full = g._count.members >= g.maxMembers;
      await prisma.group.update({
        where: { id: g.id },
        data: { status: full ? GroupStatus.CLOSED : GroupStatus.CANCELLED },
      });
      if (full) closed++;
      else cancelled++;
    }

    return NextResponse.json({
      success: true,
      closed,
      cancelled,
    });
  } catch (error) {
    console.error("Cron close-groups:", error);
    return NextResponse.json(
      { error: "Failed to close groups" },
      { status: 500 }
    );
  }
}
