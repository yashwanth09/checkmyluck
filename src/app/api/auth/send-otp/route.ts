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

    // In development, log OTP for easy testing.
    if (process.env.NODE_ENV !== "production") {
      console.log("OTP for", phone, "is", code);
      return NextResponse.json({ success: true });
    }

    // In production, send OTP via MSG91 Flow API.
    const authKey = process.env.MSG91_AUTH_KEY;
    const templateId = process.env.MSG91_TEMPLATE_ID;
    const senderId = process.env.MSG91_SENDER_ID;
    const otpVarName = process.env.MSG91_OTP_VAR_NAME || "otp";

    if (!authKey || !templateId || !senderId) {
      console.error("MSG91 env vars missing");
      return NextResponse.json(
        { error: "OTP service not configured" },
        { status: 500 }
      );
    }

    const payload: Record<string, unknown> = {
      template_id: templateId,
      sender: senderId,
      mobiles: `91${phone}`,
    };
    payload[otpVarName] = code;

    const resp = await fetch("https://api.msg91.com/api/v5/flow/", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        authkey: authKey,
      },
      body: JSON.stringify(payload),
    });

    const respText = await resp.text().catch(() => "");
    console.log("MSG91 response", resp.status, respText);

    if (!resp.ok) {
      console.error("MSG91 send error", resp.status, respText);
      return NextResponse.json(
        { error: "Failed to send OTP" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("POST /api/auth/send-otp:", error);
    return NextResponse.json(
      { error: "Failed to send OTP" },
      { status: 500 }
    );
  }
}

