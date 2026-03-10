import { cookies } from "next/headers";
import { prisma } from "./db";
import crypto from "crypto";

export const SESSION_COOKIE_NAME = "ptc_session";

type SessionPayload = {
  userId: string;
};

function getSecret(): string {
  const secret = process.env.AUTH_SECRET || process.env.CRON_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET (or CRON_SECRET) is required for user auth");
  }
  return secret;
}

function signSession(payload: SessionPayload): string {
  const secret = getSecret();
  const data = JSON.stringify(payload);
  const hmac = crypto.createHmac("sha256", secret).update(data).digest("hex");
  return Buffer.from(`${data}.${hmac}`).toString("base64url");
}

function verifySessionToken(token: string): SessionPayload | null {
  try {
    const secret = getSecret();
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const [data, signature] = decoded.split(".");
    if (!data || !signature) return null;
    const expected = crypto.createHmac("sha256", secret).update(data).digest("hex");
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
      return null;
    }
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export function createSessionToken(userId: string): string {
  return signSession({ userId });
}

export async function getCurrentUser() {
  // In Next.js 16, cookies() is async and must be awaited.
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;
  const payload = verifySessionToken(token);
  if (!payload) return null;
  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
  });
  return user;
}

