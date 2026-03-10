"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function PlayAgainButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    if (loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/games/auto-join", {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "INSUFFICIENT_BALANCE") {
          setError("Not enough wallet balance. Add cash in your wallet.");
        } else if (data.error) {
          setError(data.error);
        } else {
          setError("Could not auto-join a new game.");
        }
        return;
      }
      const nextGroupId = data.groupId as string;
      router.push(`/game/${nextGroupId}`);
    } catch {
      setError("Could not auto-join a new game.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={loading}
        className="inline-flex items-center justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Finding next game..." : "Play again →"}
      </button>
      {error && (
        <p className="mt-2 text-xs text-amber-700" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

