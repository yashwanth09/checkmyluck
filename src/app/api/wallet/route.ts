import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const transactions = await prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
    });

    return NextResponse.json({
      balance: user.walletBalance,
      transactions,
    });
  } catch (error) {
    console.error("GET /api/wallet:", error);
    return NextResponse.json(
      { error: "Failed to load wallet" },
      { status: 500 }
    );
  }
}

