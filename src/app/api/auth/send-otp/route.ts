import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const otpSchema = {
  phoneNumber: (v: unknown) =>
    typeof v === "string" && /^[6-9]\d{9}$/.test(v.replace(/\s/g, "")),
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { phoneNumber } = body as { phoneNumber?: string };

    if (!otpSchema.phoneNumber(phoneNumber)) {
      return NextResponse.json(
        { error: "Enter a valid 10-digit Indian mobile number" },
        { status: 400 }
      );
    }

    const phone = phoneNumber!.replace(/\s/g, "").trim();
    const code =
      process.env.NODE_ENV === "production"
        ? Math.floor(100000 + Math.random() * 900000).toString()
        : "123456";

    const now = new Date();
    const expiresAt = new Date(now.getTime() + 5 * 60 * 1000);

    await prisma.otpCode.create({
      data: {
        phoneNumber: phone,
        code,
        expiresAt,
      },
    });

    // TODO: Integrate real SMS provider here. For now, log in server.
    console.log("OTP for", phone, "is", code);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/auth/send-otp:", error);
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}

