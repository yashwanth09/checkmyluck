"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleLogout() {
    if (loading) return;
    setLoading(true);
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
      });
    } catch {
      // ignore error; we'll still redirect
    } finally {
      setLoading(false);
      router.push("/");
    }
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-3 py-1 text-[11px] font-medium text-zinc-700 shadow-sm hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Logging out..." : "Log out"}
    </button>
  );
}

