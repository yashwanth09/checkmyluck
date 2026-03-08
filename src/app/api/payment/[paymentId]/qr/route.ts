import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ paymentId: string }> }
) {
  try {
    const { paymentId } = await params;
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
    });

    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }

    const vpa = process.env.UPI_VPA?.trim();
    const name = process.env.UPI_PAYEE_NAME?.trim() || "BingoBids";

    if (!vpa) {
      return NextResponse.json(
        { error: "UPI not configured. Set UPI_VPA in .env" },
        { status: 503 }
      );
    }

    const amount = payment.amount.toFixed(2);
    const note = (payment.referenceId || `CML-${paymentId.slice(-6)}`).replace(/[^a-zA-Z0-9-]/g, "");

    const upiUrl = new URL("upi://pay");
    upiUrl.searchParams.set("pa", vpa);
    upiUrl.searchParams.set("pn", name);
    upiUrl.searchParams.set("am", amount);
    upiUrl.searchParams.set("tn", note);
    upiUrl.searchParams.set("cu", "INR");

    const upiString = upiUrl.toString();
    const svg = await QRCode.toString(upiString, { type: "svg", margin: 1 });

    return new NextResponse(svg, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "private, max-age=60",
      },
    });
  } catch (error) {
    console.error("GET /api/payment/[paymentId]/qr:", error);
    return NextResponse.json(
      { error: "Failed to generate payment QR" },
      { status: 500 }
    );
  }
}
