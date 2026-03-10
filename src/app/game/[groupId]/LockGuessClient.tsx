"use client";

import { useState } from "react";

type LockGuessClientProps = {
  groupId: string;
  criteria: { id: string; label: string }[];
  initialSelectedId: string | null;
  locked: boolean;
};

export function LockGuessClient(props: LockGuessClientProps) {
  const { groupId, criteria, initialSelectedId, locked } = props;
  const [selected, setSelected] = useState<string | null>(initialSelectedId);
  const [isLocked, setIsLocked] = useState(locked);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLock() {
    if (!selected || isLocked || loading) return;
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/games/${groupId}/lock-guess`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ criterionId: selected }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to lock guess");
        return;
      }
      setIsLocked(true);
    } catch {
      setError("Failed to lock guess");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 space-y-3">
      <div className="space-y-2">
        {criteria.map((c) => (
          <button
            key={c.id}
            type="button"
            disabled={isLocked}
            onClick={() => setSelected(c.id)}
            className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm ${
              selected === c.id
                ? "border-violet-500 bg-violet-50 text-violet-900"
                : "border-zinc-200 bg-white text-zinc-800 hover:border-violet-300 hover:bg-violet-50/60"
            } ${isLocked ? "cursor-default opacity-60" : ""}`}
          >
            <span>{c.label}</span>
            {selected === c.id && (
              <span className="text-xs font-semibold text-violet-700">
                Selected
              </span>
            )}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="button"
        onClick={handleLock}
        disabled={!selected || isLocked || loading}
        className="inline-flex w-full items-center justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isLocked ? "Guess locked" : loading ? "Locking..." : "Lock my guess"}
      </button>
      {isLocked && (
        <p className="mt-1 text-xs text-emerald-700">
          Your guess is locked for this game. Wait for the result after the
          timer.
        </p>
      )}
    </div>
  );
}

