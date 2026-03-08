import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        member: true,
        group: true,
      },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: payment.id,
      amount: payment.amount,
      status: payment.status,
      referenceId: payment.referenceId,
      member: {
        mobileNumber: payment.member.mobileNumber,
        bidCount: payment.member.bidCount,
      },
      group: {
        name: payment.group.name,
        entryFee: payment.group.entryFee,
      },
    });
  } catch (error) {
    console.error("GET /api/payment/[paymentId]:", error);
    return NextResponse.json(
      { error: "Failed to fetch payment" },
      { status: 500 }
    );
  }
}
