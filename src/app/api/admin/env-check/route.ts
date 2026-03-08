import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/** Only in development: check if ADMIN_SECRET is loaded (for debugging login). */
export async function GET() {
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 404 });
  }
  const set = !!process.env.ADMIN_SECRET?.trim();
  const length = (process.env.ADMIN_SECRET || "").trim().length;
  return NextResponse.json({
    adminSecretSet: set,
    adminSecretLength: length,
    hint: set ? "Secret is loaded. Use the exact value from .env.local (no extra spaces)." : "ADMIN_SECRET is missing or empty. Add it to .env or .env.local and restart the dev server.",
  });
}
