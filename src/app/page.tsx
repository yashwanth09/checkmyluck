import Link from "next/link";
import { GroupsList } from "@/components/GroupsList";
import { YesterdayWinner } from "@/components/YesterdayWinner";
import { LuckQuotes } from "@/components/LuckQuotes";

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      {/* Header - minimal, Wibify-style */}
      <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3 sm:px-6 md:max-w-4xl lg:max-w-6xl">
          <Link href="/" className="text-lg font-semibold tracking-tight text-zinc-900">
            CheckMyLuck
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/admin"
              className="text-sm text-zinc-500 transition hover:text-zinc-900"
            >
              Admin
            </Link>
          </nav>
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
              One draw.
              <br />
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                One iPhone.
              </span>
            </h1>
            <p className="mt-2 text-lg font-medium text-zinc-600 sm:text-xl">
              Enter for just <span className="font-bold text-violet-600">₹250</span> — winner every day at 7 PM
            </p>
          </div>
          <p className="shrink-0 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-medium text-violet-800">
            500 per group • 1 winner • Closes 7 PM
          </p>
        </section>

        {/* Groups first - visible without scrolling */}
        <section id="groups" className="mb-10">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2 rounded-xl bg-violet-50 px-4 py-3 ring-1 ring-violet-200/60">
            <h2 className="text-sm font-semibold uppercase tracking-widest text-violet-800">
              Live groups — join now
            </h2>
            <p className="text-xs font-medium text-violet-700">Max 10 bids per person</p>
          </div>
          <GroupsList />
        </section>

        {/* Stats - compact */}
        <section className="mb-8 grid grid-cols-3 gap-3 border-y border-zinc-200 py-5">
          <div>
            <p className="text-xl font-bold text-zinc-900 sm:text-2xl">500</p>
            <p className="mt-0.5 text-xs text-zinc-500">Members/group</p>
          </div>
          <div>
            <p className="text-xl font-bold text-zinc-900 sm:text-2xl">₹250</p>
            <p className="mt-0.5 text-xs text-zinc-500">Per bid</p>
          </div>
          <div>
            <p className="text-xl font-bold text-zinc-900 sm:text-2xl">1</p>
            <p className="mt-0.5 text-xs text-zinc-500">Winner</p>
          </div>
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
              Pick a group and enter your mobile & address
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
              Draw at 7 PM — one lucky winner gets the iPhone
            </li>
          </ol>
        </section>
      </main>

      <footer className="fixed bottom-0 left-0 right-0 border-t border-zinc-200 bg-white/95 px-4 py-3 backdrop-blur">
        <p className="mx-auto max-w-2xl text-center text-xs text-zinc-500 md:max-w-4xl lg:max-w-6xl">
          Max 10 bids per person • Groups close at 7:00 PM • One winner per
          group
        </p>
      </footer>
    </div>
  );
}
