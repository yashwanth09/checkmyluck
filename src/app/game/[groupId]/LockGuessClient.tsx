"use client";

import { useMemo, useState } from "react";

type Criterion = {
  id: string;
  label: string;
  type: string;
  value: number | null;
};

type LockGuessClientProps = {
  groupId: string;
  criteria: Criterion[];
  initialSelectedId: string | null;
  locked: boolean;
};

export function LockGuessClient(props: LockGuessClientProps) {
  const { groupId, criteria, initialSelectedId, locked } = props;
  const [selected, setSelected] = useState<string | null>(initialSelectedId);
  const [isLocked, setIsLocked] = useState(locked);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const ageCriteria = useMemo(
    () =>
      criteria.filter(
        (c) => c.type === "age_above" || c.type === "age_below"
      ),
    [criteria]
  );

  const distinctAges = useMemo(
    () =>
      Array.from(
        new Set(
          ageCriteria
            .map((c) => c.value)
            .filter((v): v is number => typeof v === "number")
        )
      ).sort((a, b) => a - b),
    [ageCriteria]
  );

  const [comparison, setComparison] = useState<"" | "above" | "below">(() => {
    const initial = criteria.find((c) => c.id === initialSelectedId);
    if (!initial) return "";
    if (initial.type === "age_above") return "above";
    if (initial.type === "age_below") return "below";
    return "";
  });

  const [age, setAge] = useState<number | "">(() => {
    const initial = criteria.find((c) => c.id === initialSelectedId);
    return initial?.value ?? "";
  });

  function updateSelected(nextComparison: "" | "above" | "below", nextAge: number | "") {
    if (!nextComparison || nextAge === "") {
      setSelected(null);
      return;
    }
    const type = nextComparison === "above" ? "age_above" : "age_below";
    const crit = ageCriteria.find(
      (c) => c.type === type && c.value === nextAge
    );
    setSelected(crit ? crit.id : null);
  }

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

  // If we don't have structured age criteria, fall back to simple buttons.
  const useDropdown =
    ageCriteria.length > 0 && distinctAges.length > 0;

  return (
    <div className="mt-4 space-y-3">
      {useDropdown ? (
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-medium text-zinc-700">
              Most players are
            </label>
            <select
              disabled={isLocked}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              value={comparison}
              onChange={(e) => {
                const value = e.target.value as "" | "above" | "below";
                setComparison(value);
                updateSelected(value, age);
              }}
            >
              <option value="">Select</option>
              <option value="above">above</option>
              <option value="below">below</option>
            </select>
          </div>
          <div className="flex-1 min-w-[120px]">
            <label className="block text-xs font-medium text-zinc-700">
              Age
            </label>
            <select
              disabled={isLocked}
              className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
              value={age === "" ? "" : String(age)}
              onChange={(e) => {
                const v = e.target.value;
                const nextAge = v === "" ? "" : Number(v);
                setAge(nextAge);
                updateSelected(comparison, nextAge);
              }}
            >
              <option value="">Select</option>
              {distinctAges.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </div>
        </div>
      ) : (
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
      )}

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

