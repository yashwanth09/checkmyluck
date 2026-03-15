import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { SESSION_COOKIE_NAME, createSessionToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

const verifySchema = {
  phoneNumber: (v: unknown) =>
    typeof v === "string" && /^[6-9]\d{9}$/.test(v.replace(/\s/g, "")),
  code: (v: unknown) => typeof v === "string" && /^\d{4,6}$/.test(v),
};

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const { phoneNumber, code } = body as {
      phoneNumber?: string;
      code?: string;
    };

    if (!verifySchema.phoneNumber(phoneNumber) || !verifySchema.code(code)) {
      return NextResponse.json(
        { error: "Invalid phone number or OTP" },
        { status: 400 }
      );
    }

    const phone = phoneNumber!.replace(/\s/g, "").trim();
    const now = new Date();

    const otp = await prisma.otpCode.findFirst({
      where: {
        phoneNumber: phone,
        code: code!,
        expiresAt: { gt: now },
        verified: false,
      },
      orderBy: { createdAt: "desc" },
    });

    if (!otp) {
      return NextResponse.json(
        { error: "Incorrect or expired OTP" },
        { status: 400 }
      );
    }

    await prisma.otpCode.update({
      where: { id: otp.id },
      data: { verified: true },
    });

    let user = await prisma.user.findUnique({
      where: { phoneNumber: phone },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phoneNumber: phone,
        },
      });
    }

    const needsProfile = !user.name || !user.state || !user.dateOfBirth;

    const token = createSessionToken(user.id);
    const res = NextResponse.json({
      success: true,
      needsProfile,
    });

    res.cookies.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 90, // 90 days
    });

    return res;
  } catch (error) {
    console.error("POST /api/auth/verify-otp:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 }
    );
  }
}

