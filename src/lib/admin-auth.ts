import { ADMIN_SECRET } from "@/lib/constants";

/** Use this in API routes; trims both header and env secret so .env newlines/spaces don't break login. */
export function isAdmin(req: Request): boolean {
  const header = (req.headers.get("x-admin-secret") || "").trim();
  const secret = (ADMIN_SECRET || "").trim();
  return secret.length > 0 && header === secret;
}
