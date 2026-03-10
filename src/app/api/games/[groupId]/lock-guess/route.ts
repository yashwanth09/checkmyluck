import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { GroupStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

const schema = {
  criterionId: (v: unknown) => typeof v === "string" && v.length > 0,
};

export async function POST(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { criterionId } = body as { criterionId?: string };

    if (!schema.criterionId(criterionId)) {
      return NextResponse.json(
        { error: "Select a prediction option" },
        { status: 400 }
      );
    }

    const { groupId } = await params;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: { criteria: true },
    });

    if (!group) {
      return NextResponse.json({ error: "Game not found" }, { status: 404 });
    }

    if (
      group.status !== GroupStatus.OPEN &&
      group.status !== GroupStatus.FULL
    ) {
      return NextResponse.json(
        { error: "Game is not accepting guesses" },
        { status: 400 }
      );
    }

    const belongs = group.criteria.some((c) => c.id === criterionId);
    if (!belongs) {
      return NextResponse.json(
        { error: "Invalid prediction option" },
        { status: 400 }
      );
    }

    const member = await prisma.member.findFirst({
      where: {
        groupId,
        userId: user.id,
      },
    });

    if (!member) {
      return NextResponse.json(
        { error: "You have not joined this game" },
        { status: 400 }
      );
    }

    if (member.guessLockedAt) {
      return NextResponse.json(
        { error: "Your guess is already locked" },
        { status: 400 }
      );
    }

    await prisma.member.update({
      where: { id: member.id },
      data: {
        selectedCriterionId: criterionId,
        guessLockedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/games/[groupId]/lock-guess:", error);
    return NextResponse.json(
      { error: "Failed to lock guess" },
      { status: 500 }
    );
  }
}

