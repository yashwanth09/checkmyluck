import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { GroupStatus, PaymentStatus, TransactionType } from "@prisma/client";
import { v4 as uuidv4 } from "uuid";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { groupId } = await params;
    const nowTime = new Date();

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        _count: { select: { members: true } },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (nowTime > group.closesAt) {
      if (
        group.status === GroupStatus.OPEN ||
        group.status === GroupStatus.FULL
      ) {
        await prisma.group.update({
          where: { id: groupId },
          data: { status: GroupStatus.CANCELLED },
        });
      }
      return NextResponse.json(
        { error: "Time's up. This game is closed." },
        { status: 400 }
      );
    }

    if (group.status !== GroupStatus.OPEN && group.status !== GroupStatus.FULL) {
      return NextResponse.json(
        { error: "Game is not open for joining" },
        { status: 400 }
      );
    }

    if (group._count.members >= group.maxMembers) {
      return NextResponse.json(
        { error: "Game is full" },
        { status: 400 }
      );
    }

    // Prevent duplicate join by same user
    const existing = await prisma.member.findFirst({
      where: {
        groupId,
        userId: user.id,
      },
      select: { id: true },
    });

    if (existing) {
      return NextResponse.json(
        { error: "You already joined this game" },
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
              meta: { groupId },
            },
          },
        },
      });

      const member = await tx.member.create({
        data: {
          groupId,
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

      const payment = await tx.payment.create({
        data: {
          memberId: member.id,
          groupId,
          amount: entryFee,
          status: PaymentStatus.CONFIRMED,
          referenceId: `WALLET-${uuidv4().slice(0, 8).toUpperCase()}`,
        },
      });

      // If this join fills the game, mark it FULL so it can be closed and drawn.
      const updatedGroup = await tx.group.update({
        where: { id: groupId },
        data:
          group._count.members + 1 >= group.maxMembers
            ? { status: GroupStatus.FULL }
            : {},
      });

      return {
        balance: updatedUser.walletBalance,
        memberId: member.id,
        paymentId: payment.id,
        groupStatus: updatedGroup.status,
      };
    });

    return NextResponse.json({
      success: true,
      balance: result.balance,
      memberId: result.memberId,
      paymentId: result.paymentId,
      groupStatus: result.groupStatus,
    });
  } catch (error) {
    console.error("POST /api/games/[groupId]/join:", error);
    return NextResponse.json(
      { error: "Failed to join game" },
      { status: 500 }
    );
  }
}

