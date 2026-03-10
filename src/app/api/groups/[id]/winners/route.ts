import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const group = await prisma.group.findUnique({
      where: { id },
      include: {
        members: {
          where: { paymentStatus: "CONFIRMED" },
          orderBy: { joinedAt: "asc" },
          include: {
            selectedCriterion: true,
          },
        },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    const players = group.members.map((m) => ({
      id: m.id,
      userId: m.userId,
      displayName: m.displayName,
      mobileMasked:
        m.mobileNumber.length >= 4
          ? `${m.mobileNumber.slice(0, 2)}******${m.mobileNumber.slice(-2)}`
          : "**********",
      totalAmount: m.totalAmount,
      bidCount: m.bidCount,
      isWinner: m.isWinner,
      criterion: m.selectedCriterion
        ? {
            id: m.selectedCriterion.id,
            label: m.selectedCriterion.label,
            type: m.selectedCriterion.type,
            value: m.selectedCriterion.value,
          }
        : null,
    }));

    return NextResponse.json({
      group: {
        id: group.id,
        name: group.name,
        entryFee: group.entryFee,
        maxMembers: group.maxMembers,
      },
      players,
    });
  } catch (error) {
    console.error("GET /api/groups/[id]/winners:", error);
    return NextResponse.json(
      { error: "Failed to fetch winners" },
      { status: 500 }
    );
  }
}

