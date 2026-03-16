"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatRupees } from "@/lib/utils";

type Criterion = {
  id: string;
  label: string;
  type: string;
  value: number | null;
};

type Player = {
  id: string;
  userId: string | null;
  displayName: string | null;
  mobileMasked: string;
  totalAmount: number;
  bidCount: number;
  isWinner: boolean;
  criterion: Criterion | null;
};

type WinnersResponse = {
  group: {
    id: string;
    name: string;
    entryFee: number;
    maxMembers: number;
  };
  players: Player[];
};

type Props = {
  groupId: string;
  currentUserId: string;
};

export function GameResultsInline({ groupId, currentUserId }: Props) {
  const router = useRouter();
  const [data, setData] = useState<WinnersResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const refreshedOnWin = useRef(false);
   const [showWinModal, setShowWinModal] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchResults() {
      setLoading(true);
      try {
        const res = await fetch(`/api/groups/${groupId}/winners`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = (await res.json()) as WinnersResponse;
        if (!cancelled) {
          setData(json);
        }
      } catch {
        // ignore for now
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    // Poll every 4 seconds until we have at least one winner.
    fetchResults();
    const id = setInterval(fetchResults, 4000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [groupId]);

  if (!data) {
    return (
      <p className="mt-3 text-xs text-zinc-500">
        Waiting for result… The game will settle shortly after the timer ends.
      </p>
    );
  }

  const winners = data.players.filter((p) => p.isWinner);
  const losers = data.players.filter((p) => !p.isWinner);

  if (winners.length === 0) {
    return (
      <p className="mt-3 text-xs text-zinc-500">
        Results will appear here once the draw is complete.
      </p>
    );
  }

  const totalPool = data.group.entryFee * data.group.maxMembers;
  const platformFee = Math.floor(totalPool * 0.1);
  const prizePool = totalPool - platformFee;
  const perWinner =
    winners.length > 0 ? Math.floor(prizePool / winners.length) : 0;

  const myPlayer = data.players.find((p) => p.userId === currentUserId);
  const isCurrentUserWinner = !!myPlayer?.isWinner && perWinner > 0;

  useEffect(() => {
    if (isCurrentUserWinner && !refreshedOnWin.current) {
      refreshedOnWin.current = true;
      router.refresh();
    }
  }, [isCurrentUserWinner, router]);

  return (
    <>
      {isCurrentUserWinner && showWinModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl border border-emerald-200 bg-emerald-50 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-emerald-900">
                  🎉 You won {formatRupees(perWinner)}!
                </p>
                <p className="mt-1 text-xs text-emerald-800">
                  Your wallet has been updated. Check it in the lobby or wallet page.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowWinModal(false)}
                className="ml-2 inline-flex h-7 w-7 items-center justify-center rounded-full border border-emerald-300 bg-white text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 shadow-sm">
        <p className="text-sm font-semibold text-emerald-900">
          Game result
        </p>
        <p className="mt-1 text-xs text-emerald-800">
          Winners are those whose chosen criterion matched the final group.
          Prize is split between all winners.
        </p>
        {isCurrentUserWinner && (
          <div className="mt-3 rounded-xl bg-gradient-to-r from-emerald-500 via-lime-400 to-emerald-500 p-3 text-white shadow-md">
            <p className="text-sm font-semibold">
              🎉 You won {formatRupees(perWinner)}!
            </p>
            <p className="text-xs text-emerald-50">
              Your wallet has been updated.
            </p>
          </div>
        )}
      <div className="mt-3 grid gap-3 text-xs md:grid-cols-2">
        <div className="rounded-lg border border-emerald-200 bg-white/70 p-3">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700">
            Winners ({winners.length})
          </p>
          <div className="mt-2 space-y-1">
            {winners.map((w) => (
              <div key={w.id}>
                <p className="text-sm font-semibold text-emerald-900">
                  {w.displayName?.trim() ||
                    `****${w.mobileMasked.slice(-2)}`}
                </p>
                <p className="text-[11px] text-emerald-700">
                  Won {formatRupees(perWinner)} on{" "}
                  {formatRupees(w.totalAmount)} entry
                  {w.criterion ? ` • Selected: ${w.criterion.label}` : ""}
                </p>
              </div>
            ))}
          </div>
        </div>
        {losers.length > 0 && (
          <div className="rounded-lg border border-emerald-200 bg-white/70 p-3">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-emerald-700">
              Others ({losers.length})
            </p>
            <div className="mt-2 space-y-1">
              {losers.map((p) => (
                <div key={p.id}>
                  <p className="text-sm font-medium text-zinc-900">
                    {p.displayName?.trim() ||
                      `****${p.mobileMasked.slice(-2)}`}
                  </p>
                  {p.criterion && (
                    <p className="text-[11px] text-zinc-600">
                      Selected: {p.criterion.label}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}

