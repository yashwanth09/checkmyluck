import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { GroupStatus, PaymentStatus, TransactionType } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

export async function POST() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();

    // Find an open game the user hasn't joined yet, soonest to close.
    const group = await prisma.group.findFirst({
      where: {
        status: { in: [GroupStatus.OPEN, GroupStatus.FULL] },
        closesAt: { gt: now },
        members: {
          none: {
            userId: user.id,
          },
        },
      },
      orderBy: { closesAt: "asc" },
      include: {
        _count: { select: { members: true } },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "No available games to join" },
        { status: 404 }
      );
    }

    if (group._count.members >= group.maxMembers) {
      return NextResponse.json(
        { error: "Selected game is full" },
        { status: 400 }
      );
    }

    const entryFee = group.entryFee;
    if (user.walletBalance < entryFee) {
      return NextResponse.json(
        { error: "Insufficient wallet balance", code: "INSUFFICIENT_BALANCE" },
        { status: 400 }
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          walletBalance: { decrement: entryFee },
          transactions: {
            create: {
              type: TransactionType.GAME_ENTRY,
              amount: -entryFee,
              meta: { groupId: group.id, autoJoin: true },
            },
          },
        },
      });

      const member = await tx.member.create({
        data: {
          groupId: group.id,
          userId: user.id,
          mobileNumber: user.phoneNumber,
          address: "Wallet player",
          displayName: undefined,
          bidCount: 1,
          totalAmount: entryFee,
          paymentStatus: PaymentStatus.CONFIRMED,
          isBot: false,
          age: user.age ?? undefined,
          gender: user.gender ?? undefined,
        },
      });

      await tx.payment.create({
        data: {
          memberId: member.id,
          groupId: group.id,
          amount: entryFee,
          status: PaymentStatus.CONFIRMED,
          referenceId: `WALLET-${uuidv4().slice(0, 8).toUpperCase()}`,
        },
      });

      // Mark FULL if this join fills the game
      const updatedGroup = await tx.group.update({
        where: { id: group.id },
        data:
          group._count.members + 1 >= group.maxMembers
            ? { status: GroupStatus.FULL }
            : {},
      });

      return {
        groupId: updatedGroup.id,
        balance: updatedUser.walletBalance,
      };
    });

    return NextResponse.json({
      success: true,
      groupId: result.groupId,
      balance: result.balance,
    });
  } catch (error) {
    console.error("POST /api/games/auto-join:", error);
    return NextResponse.json(
      { error: "Failed to auto-join game" },
      { status: 500 }
    );
  }
}

