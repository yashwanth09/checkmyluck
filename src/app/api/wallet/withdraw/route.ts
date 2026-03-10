import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { TransactionType } from "@prisma/client";

export const dynamic = "force-dynamic";

const withdrawSchema = {
  amount: (v: unknown) => {
    const n = Number(v);
    return Number.isInteger(n) && n > 0 && n <= 100000;
  },
  upiId: (v: unknown) =>
    typeof v === "string" && v.trim().length >= 5 && v.includes("@"),
};

export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { amount, upiId } = body as { amount?: number; upiId?: string };

    if (!withdrawSchema.amount(amount) || !withdrawSchema.upiId(upiId)) {
      return NextResponse.json(
        { error: "Enter a valid amount and UPI ID" },
        { status: 400 }
      );
    }

    const value = Number(amount);

    if (user.walletBalance < value) {
      return NextResponse.json(
        { error: "Insufficient balance" },
        { status: 400 }
      );
    }

    const updated = await prisma.$transaction(async (tx) => {
      const userRow = await tx.user.update({
        where: { id: user.id },
        data: {
          walletBalance: { decrement: value },
          transactions: {
            create: {
              type: TransactionType.WITHDRAW,
              amount: -value,
              meta: { upiId },
            },
          },
        },
      });
      return userRow;
    });

    // TODO: Integrate real payout; for now we just log.
    console.log("Mock withdraw", value, "to", upiId, "for user", user.id);

    return NextResponse.json({
      success: true,
      balance: updated.walletBalance,
    });
  } catch (error) {
    console.error("POST /api/wallet/withdraw:", error);
    return NextResponse.json(
      { error: "Failed to withdraw" },
      { status: 500 }
    );
  }
}

