import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ADMIN_SECRET } from "@/lib/constants";

export const dynamic = "force-dynamic";

function isAdmin(req: Request): boolean {
  return req.headers.get("x-admin-secret") === ADMIN_SECRET;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const members = await prisma.member.findMany({
      where: { groupId: id },
      orderBy: { joinedAt: "desc" },
    });

    return NextResponse.json(
      members.map((m) => ({
        ...m,
        joinedAt: m.joinedAt.toISOString(),
      }))
    );
  } catch (error) {
    console.error("GET /api/admin/groups/[id]/members:", error);
    return NextResponse.json(
      { error: "Failed to fetch members" },
      { status: 500 }
    );
  }
}
