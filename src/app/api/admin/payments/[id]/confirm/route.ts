import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ADMIN_SECRET } from "@/lib/constants";

export const dynamic = "force-dynamic";

function isAdmin(req: Request): boolean {
  return req.headers.get("x-admin-secret") === ADMIN_SECRET;
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!isAdmin(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    const { id } = await params;
    const payment = await prisma.payment.findUnique({
      where: { id },
      include: { member: true },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    if (payment.status === "CONFIRMED") {
      return NextResponse.json(
        { error: "Payment already confirmed" },
        { status: 400 }
      );
    }

    await prisma.$transaction([
      prisma.payment.update({
        where: { id },
        data: {
          status: "CONFIRMED",
          confirmedAt: new Date(),
          confirmedBy: "admin",
        },
      }),
      prisma.member.update({
        where: { id: payment.memberId },
        data: { paymentStatus: "CONFIRMED" },
      }),
    ]);

    return NextResponse.json({ success: true, message: "Payment confirmed" });
  } catch (error) {
    console.error("POST /api/admin/payments/[id]/confirm:", error);
    return NextResponse.json(
      { error: "Failed to confirm payment" },
      { status: 500 }
    );
  }
}
