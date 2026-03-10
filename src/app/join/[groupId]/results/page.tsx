import Link from "next/link";
import { formatRupees } from "@/lib/utils";
import { PlayAgainButton } from "./play-again";
import { getCurrentUser } from "@/lib/auth";

type WinnersResponse = {
  group: {
    id: string;
    name: string;
    entryFee: number;
    maxMembers: number;
  };
  players: Array<{
    id: string;
    userId: string | null;
    displayName: string | null;
    mobileMasked: string;
    totalAmount: number;
    bidCount: number;
    isWinner: boolean;
    criterion: {
      id: string;
      label: string;
      type: string;
      value: number | null;
    } | null;
  }>;
};

export default async function GroupResultsPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const { groupId } = await params;
  const base =
    process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const res = await fetch(`${base}/api/groups/${groupId}/winners`, {
    cache: "no-store",
  });
  const data: WinnersResponse = await res.json();

  if (!res.ok || (data as any).error) {
    return (
      <div className="min-h-screen bg-zinc-50 text-zinc-900">
        <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 md:max-w-4xl lg:max-w-6xl">
          <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
            Unable to load results for this group.
          </p>
        </main>
      </div>
    );
  }

  const currentUser = await getCurrentUser();

  const { group, players } = data;
  const winners = players.filter((p) => p.isWinner);
  const losers = players.filter((p) => !p.isWinner);

  // Recompute actual per-winner payout (same formula as draw cron).
  const totalPool = group.entryFee * group.maxMembers;
  const platformFee = Math.floor(totalPool * 0.1);
  const prizePool = totalPool - platformFee;
  const perWinner =
    winners.length > 0 ? Math.floor(prizePool / winners.length) : 0;

  const myPlayer = currentUser
    ? players.find((p) => p.userId === currentUser.id)
    : null;
  const isCurrentUserWinner = !!myPlayer?.isWinner && perWinner > 0;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-10 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center px-4 py-4 sm:px-6 md:max-w-4xl lg:max-w-6xl">
          <Link
            href={`/join/${group.id}`}
            className="text-sm text-zinc-500 transition hover:text-zinc-900"
            aria-label="Back to group"
          >
            ← Back to group
          </Link>
          <h1 className="ml-4 text-sm font-medium uppercase tracking-widest text-zinc-500">
            Group results
          </h1>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-8 pb-12 sm:px-6 md:max-w-4xl lg:max-w-6xl">
        <div className="mx-auto max-w-xl space-y-6">
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <h2 className="text-lg font-semibold text-emerald-900">
              {group.name}
            </h2>
            <p className="mt-1 text-sm text-emerald-800">
              Winners are those whose chosen criterion matched the final group.
              Prize is split between all winners.
            </p>
            {isCurrentUserWinner && (
              <div className="mt-3 rounded-xl bg-gradient-to-r from-emerald-500 via-lime-400 to-emerald-500 p-3 text-white shadow-md">
                <p className="text-sm font-semibold">
                  🎉 You won {formatRupees(perWinner)}!
                </p>
                <p className="text-xs text-emerald-50">
                  Your wallet has been updated. Check it in the lobby or wallet
                  page.
                </p>
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <PlayAgainButton />
              <Link
                href="/lobby"
                className="inline-flex items-center rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
              >
                ← Back to lobby
              </Link>
            </div>
          </div>

          {winners.length === 0 ? (
            <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
              No winners were selected for this group.
            </div>
          ) : (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-medium uppercase tracking-widest text-zinc-500">
                Winners ({winners.length})
              </h3>
              <div className="mt-3 divide-y divide-zinc-200">
                {winners.map((w) => (
                  <div
                    key={w.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="text-sm font-semibold text-zinc-900">
                        {w.displayName?.trim() ||
                          `****${w.mobileMasked.slice(-2)}`}
                      </p>
                      <p className="text-xs font-medium text-emerald-700">
                        {w.displayName?.trim() ||
                          `****${w.mobileMasked.slice(-2)}`}{" "}
                        won {formatRupees(perWinner)} for an entry of{" "}
                        {formatRupees(w.totalAmount)}.
                      </p>
                      {w.criterion && (
                        <p className="text-xs text-zinc-500">
                          Selected: {w.criterion.label}.
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {losers.length > 0 && (
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <h3 className="text-sm font-medium uppercase tracking-widest text-zinc-500">
                Others ({losers.length})
              </h3>
              <div className="mt-3 divide-y divide-zinc-200">
                {losers.map((p) => (
                  <div
                    key={p.id}
                    className="flex flex-wrap items-center justify-between gap-3 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-zinc-900">
                        {p.displayName?.trim() ||
                          `****${p.mobileMasked.slice(-2)}`}
                      </p>
                      {p.criterion && (
                        <p className="text-xs text-zinc-500">
                          Selected: {p.criterion.label}.
                        </p>
                      )}
                    </div>
                    <div className="text-right text-xs text-zinc-500">
                      <p>Entry: {formatRupees(p.totalAmount)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

