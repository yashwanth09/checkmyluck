"use client";

import { useEffect, useState } from "react";

type Winner = {
  groupName: string;
  drawDoneAt: string | null;
  winnerName: string | null;
  winnerMobileMasked: string;
};

function formatDrawDate(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  if (d.toDateString() === today.toDateString()) return "Today";
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export function YesterdayWinner() {
  const [winners, setWinners] = useState<Winner[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/winners?days=7")
      .then((r) => r.json())
      .then((data) => setWinners(data.winners || []))
      .catch(() => setWinners([]))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-medium uppercase tracking-widest text-zinc-500">
          Recent winners
        </h3>
        <div className="mt-4 h-20 animate-pulse rounded-xl bg-zinc-100" />
      </section>
    );
  }

  if (winners.length === 0) {
    return (
      <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h3 className="text-sm font-medium uppercase tracking-widest text-zinc-500">
          Recent winners
        </h3>
        <p className="mt-4 text-sm text-zinc-500">
          Winners will appear here after each 7 PM draw. Could you be next?
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h3 className="text-sm font-medium uppercase tracking-widest text-zinc-500">
        Recent winners
      </h3>
      <ul className="mt-4 space-y-4">
        {winners.map((w, i) => (
          <li
            key={`${w.groupName}-${w.drawDoneAt}-${i}`}
            className="flex flex-wrap items-baseline justify-between gap-2 border-b border-zinc-100 pb-4 last:border-0 last:pb-0"
          >
            <div>
              <p className="font-semibold text-zinc-900">
                {w.winnerName || `****${w.winnerMobileMasked.slice(-2)}`}
              </p>
              <p className="text-sm text-zinc-500">{w.groupName}</p>
            </div>
            <span className="text-xs font-medium text-violet-600">
              {formatDrawDate(w.drawDoneAt)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
