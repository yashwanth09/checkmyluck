import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { GroupStatus } from "@prisma/client";
import { INDIAN_STATES } from "@/lib/constants";

export const dynamic = "force-dynamic";

const AGES = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
const schema = {
  criterionId: (v: unknown) => typeof v === "string" && v.length > 0,
  comparison: (v: unknown) => v === "above" || v === "below",
  age: (v: unknown) =>
    typeof v === "number" && Number.isInteger(v) && AGES.includes(v),
  state: (v: unknown) =>
    typeof v === "string" && v.length > 0 && INDIAN_STATES.includes(v as typeof INDIAN_STATES[number]),
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
    const {
      criterionId,
      comparison,
      age,
      state: stateValue,
    } = body as {
      criterionId?: string;
      comparison?: "above" | "below";
      age?: number;
      state?: string;
    };

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

    let resolvedCriterionId: string;

    if (schema.criterionId(criterionId)) {
      const id = criterionId as string;
      const belongs = group.criteria.some((c) => c.id === id);
      if (!belongs) {
        return NextResponse.json(
          { error: "Invalid prediction option" },
          { status: 400 }
        );
      }
      resolvedCriterionId = id;
    } else if (schema.comparison(comparison) && schema.age(age)) {
      const type = comparison === "above" ? "age_above" : "age_below";
      const label =
        comparison === "above"
          ? `Mostly ${age} or older`
          : `Mostly under ${age}`;
      let criterion = group.criteria.find(
        (c) => c.type === type && c.value === age
      );
      if (!criterion) {
        const maxOrder =
          group.criteria.length > 0
            ? Math.max(...group.criteria.map((c) => c.order))
            : -1;
        criterion = await prisma.groupCriterion.create({
          data: {
            groupId,
            label,
            type,
            value: age,
            order: maxOrder + 1,
          },
        });
      }
      resolvedCriterionId = criterion.id;
    } else if (schema.state(stateValue)) {
      let criterion = group.criteria.find(
        (c) => c.type === "majority_state" && c.valueStr === stateValue
      );
      if (!criterion) {
        const maxOrder =
          group.criteria.length > 0
            ? Math.max(...group.criteria.map((c) => c.order))
            : -1;
        criterion = await prisma.groupCriterion.create({
          data: {
            groupId,
            label: `Majority from ${stateValue}`,
            type: "majority_state",
            value: null,
            valueStr: stateValue,
            order: maxOrder + 1,
          },
        });
      }
      resolvedCriterionId = criterion.id;
    } else {
      return NextResponse.json(
        { error: "Select a prediction option" },
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
        selectedCriterionId: resolvedCriterionId,
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

