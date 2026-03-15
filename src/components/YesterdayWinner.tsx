"use client";

import { useEffect, useState } from "react";

type Winner = {
  groupName: string;
  drawDoneAt: string | null;
  winnerName: string | null;
  winnerMobileMasked: string;
  winAmount: number;
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
      .then((data) => {
        const list = Array.isArray(data?.winners) ? data.winners : [];
        const flat: Winner[] = list.flatMap(
          (g: {
            groupName?: string;
            drawDoneAt?: string | null;
            winners?: {
              winnerName?: string | null;
              winnerMobileMasked?: string;
              winAmount?: number;
            }[];
          }) =>
            (Array.isArray(g?.winners) ? g.winners : []).map(
              (w: {
                winnerName?: string | null;
                winnerMobileMasked?: string;
                winAmount?: number;
              }) => ({
                groupName: g.groupName ?? "",
                drawDoneAt: g.drawDoneAt ?? null,
                winnerName: w.winnerName ?? null,
                winnerMobileMasked: w.winnerMobileMasked ?? "****",
                winAmount: typeof w.winAmount === "number" ? w.winAmount : 0,
              })
            )
        );
        setWinners(flat);
      })
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
          Winners will appear here after each draw. Could you be next?
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h3 className="text-xs font-medium uppercase tracking-widest text-zinc-500">
        Recent winners
      </h3>
      <ul className="mt-2 space-y-1 text-xs text-zinc-600">
        {winners.map((w, i) => (
          <li key={`${w.groupName}-${w.winnerMobileMasked}-${i}`}>
            <span className="font-semibold text-zinc-900">
              {w.winnerName || `****${w.winnerMobileMasked.slice(-2)}`}
            </span>{" "}
            has won ₹{w.winAmount.toLocaleString("en-IN")} from{" "}
            <span className="font-medium">{w.groupName}</span>{" "}
            <span className="text-[0.7rem] text-zinc-400">
              ({formatDrawDate(w.drawDoneAt)})
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
