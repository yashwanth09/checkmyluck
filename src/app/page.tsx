import Link from "next/link";
import { GroupsList } from "@/components/GroupsList";
import { YesterdayWinner } from "@/components/YesterdayWinner";
import { LuckQuotes } from "@/components/LuckQuotes";
import { getCurrentUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function Home() {
  const user = await getCurrentUser();
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Banner / Header */}
      <header className="sticky top-0 z-20 border-b border-violet-200/60 bg-gradient-to-r from-violet-50 via-white to-fuchsia-50/80 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-2xl flex-col items-center justify-center px-4 py-4 sm:px-6 sm:py-5 md:max-w-4xl lg:max-w-6xl">
          <Link href={user ? "/lobby" : "/"} className="text-center">
            <span className="block text-2xl font-bold tracking-tight sm:text-3xl md:text-4xl">
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                BingoBids
              </span>
            </span>
            <span className="mt-1 block text-sm font-medium italic text-violet-600 sm:text-base">
              Bid small. Win big.
            </span>
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4 pb-32 pt-4 sm:px-6 sm:pt-5 md:max-w-4xl lg:max-w-6xl">
        {/* Quote + compact hero - minimal so groups show above fold */}
        <section className="mb-4">
          <LuckQuotes />
        </section>
        <section className="mb-6 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold leading-tight tracking-tight text-zinc-900 sm:text-4xl md:text-5xl">
              Guess the crowd.
              <br />
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                Win with your prediction.
              </span>
            </h1>
            <p className="mt-2 text-lg font-medium text-zinc-600 sm:text-xl">
              Join a game, guess who most players will be, and share the prize pool if your prediction is right.
            </p>
            <p className="mt-2 text-sm font-semibold italic text-violet-600 sm:text-base">
              Bid small. Guess smart. Win big.
            </p>
          </div>
          <p className="shrink-0 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-medium text-violet-800">
            Criteria-based winners • Timer per group
          </p>
        </section>

        {/* Win or refund - attractive guarantee */}
        <section className="mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-violet-700 p-6 text-white shadow-xl shadow-violet-500/25 ring-1 ring-white/20 sm:p-8">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/90">
            No risk. Two outcomes.
          </p>
          <div className="mt-4 flex flex-col items-center justify-center gap-6 sm:flex-row sm:gap-12">
            <div className="flex items-center gap-3 rounded-xl bg-white/15 px-5 py-4 backdrop-blur sm:px-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/25 text-2xl">
                🏆
              </span>
              <div>
                <p className="font-bold">You win</p>
                <p className="text-lg font-extrabold tracking-tight">You win if your chosen criterion matches the group.</p>
              </div>
            </div>
            <p className="text-2xl font-medium text-white/80 sm:text-3xl">or</p>
            <div className="flex items-center gap-3 rounded-xl bg-white/15 px-5 py-4 backdrop-blur sm:px-6">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white/25 text-2xl">
                💰
              </span>
              <div>
                <p className="font-bold">Refund</p>
                <p className="text-lg font-extrabold tracking-tight">Your money back — no loss.</p>
              </div>
            </div>
          </div>
          <p className="mt-5 text-center text-sm font-medium text-white/90">
            Winners are those whose chosen criterion matches the group (e.g. majority male). If the group doesn’t fill in time, we refund everyone. Play safe.
          </p>
        </section>

        {/* Groups first - visible without scrolling */}
        <section id="groups" className="mb-10">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-violet-50 px-4 py-3 ring-1 ring-violet-200/60">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-violet-800">
              Live games — join now
            </h2>
            <div className="flex items-center gap-2">
              <p className="text-xs font-medium text-violet-700">
                1 seat per player per game
              </p>
              <Link
                href={user ? "/lobby" : "/login"}
                className="inline-flex items-center rounded-full bg-violet-600 px-3 py-1 text-xs font-semibold text-white shadow-sm hover:bg-violet-700"
              >
                {user ? "Go to lobby" : "Login to play"}
              </Link>
            </div>
          </div>
          <GroupsList />
        </section>

        {/* Recent winners */}
        <section className="mb-10">
          <YesterdayWinner />
        </section>

        {/* How it works - compact */}
        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h3 className="text-sm font-medium uppercase tracking-widest text-zinc-500">
            How it works
          </h3>
          <ol className="mt-4 grid gap-4 text-sm text-zinc-600 sm:grid-cols-1 md:grid-cols-3">
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600">
                1
              </span>
              Pick a group and enter your name, mobile number, and address
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600">
                2
              </span>
              Choose 1–10 bids (₹250 each) and pay via QR
            </li>
            <li className="flex gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-medium text-zinc-600">
                3
              </span>
              <span>
                Winners are those whose chosen criterion matches the group. If the group doesn’t fill in time, we refund everyone.
                If the group doesn’t fill, we refund everyone.
              </span>
            </li>
          </ol>
          <p className="mt-4 rounded-lg bg-amber-50 px-4 py-2 text-sm text-amber-800 ring-1 ring-amber-200/60">
            <strong>Draw only when full.</strong> If the group doesn't fill in time, it's cancelled and we refund everyone.
          </p>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur">
        <p className="mx-auto max-w-2xl text-center text-xs text-zinc-500 md:max-w-4xl lg:max-w-6xl">
          1 entry per mobile number • Groups close when full or when timer ends • Draw only when full (else refund)
        </p>
      </footer>
    </div>
  );
}
