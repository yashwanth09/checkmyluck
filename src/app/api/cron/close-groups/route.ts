import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GroupStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

// Call this via cron at 7:01 PM daily (e.g. Vercel Cron, GitHub Actions)
// Or run: curl -H "Authorization: Bearer YOUR_CRON_SECRET" /api/cron/close-groups
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const result = await prisma.group.updateMany({
      where: {
        status: GroupStatus.OPEN,
        closesAt: { lte: now },
      },
      data: { status: GroupStatus.CLOSED },
    });

    return NextResponse.json({
      success: true,
      closed: result.count,
    });
  } catch (error) {
    console.error("Cron close-groups:", error);
    return NextResponse.json(
      { error: "Failed to close groups" },
      { status: 500 }
    );
  }
}
