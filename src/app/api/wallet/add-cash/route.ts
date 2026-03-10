import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { TransactionType } from "@prisma/client";

export const dynamic = "force-dynamic";

const addCashSchema = {
  amount: (v: unknown) => {
    const n = Number(v);
    return Number.isInteger(n) && n > 0 && n <= 100000;
  },
};

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { amount } = body as { amount?: number };

    if (!addCashSchema.amount(amount)) {
      return NextResponse.json(
        { error: "Enter a valid amount to add" },
        { status: 400 }
      );
    }

    const value = Number(amount);

    const updated = await prisma.$transaction(async (tx) => {
      const userRow = await tx.user.update({
        where: { id: user.id },
        data: {
          walletBalance: { increment: value },
          transactions: {
            create: {
              type: TransactionType.ADD_CASH,
              amount: value,
              meta: { source: "mock" },
            },
          },
        },
      });
      return userRow;
    });

    return NextResponse.json({
      success: true,
      balance: updated.walletBalance,
    });
  } catch (error) {
    console.error("POST /api/wallet/add-cash:", error);
    return NextResponse.json(
      { error: "Failed to add cash" },
      { status: 500 }
    );
  }
}

