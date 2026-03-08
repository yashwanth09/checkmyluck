import { NextResponse } from "next/server";
import QRCode from "qrcode";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const data = searchParams.get("data");
  if (!data || data.length > 500) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }
  try {
    const svg = await QRCode.toString(data, { type: "svg", margin: 1 });
    return new NextResponse(svg, {
      headers: { "Content-Type": "image/svg+xml" },
    });
  } catch {
    return NextResponse.json({ error: "Failed to generate QR" }, { status: 500 });
  }
}
