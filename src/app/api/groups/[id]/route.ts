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
        _count: { select: { members: true } },
        criteria: { orderBy: { order: "asc" } },
      },
    });

    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }

    return NextResponse.json({
      ...group,
      memberCount: group._count.members,
      slotsLeft: group.maxMembers - group._count.members,
      closesAt: group.closesAt.toISOString(),
      criteria: group.criteria.map((c) => ({
        id: c.id,
        label: c.label,
        type: c.type,
        value: c.value,
        order: c.order,
      })),
    });
  } catch (error) {
    console.error("GET /api/groups/[id]:", error);
    return NextResponse.json(
      { error: "Failed to fetch group" },
      { status: 500 }
    );
  }
}
