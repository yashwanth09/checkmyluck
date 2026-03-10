import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { formatRupees } from "@/lib/utils";
import { GroupsList } from "@/components/GroupsList";
import { LogoutButton } from "@/components/LogoutButton";

export const dynamic = "force-dynamic";

export default async function LobbyPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-violet-200/60 bg-gradient-to-r from-violet-50 via-white to-fuchsia-50/80 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-700">
              Predict the Crowd
            </p>
            <p className="text-sm font-medium text-zinc-800">
              Guess who most players will be and win the pool.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <a
                href="/"
                className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-3 py-1 text-[11px] font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
              >
                ← Back to home
              </a>
              <a
                href="/profile"
                className="inline-flex items-center rounded-full border border-violet-200 bg-white px-3 py-1 text-[11px] font-medium text-violet-700 shadow-sm hover:bg-violet-50"
              >
                Edit profile
              </a>
            </div>
          </div>
          <div className="text-right">
            <p className="text-[11px] font-medium text-zinc-500">
              Logged in as{" "}
              <span className="font-semibold text-zinc-700">
                {user.name
                  ? `${user.name} (${user.phoneNumber.length >= 10
                      ? `${user.phoneNumber.slice(0, 4)}******${user.phoneNumber.slice(-2)}`
                      : user.phoneNumber
                    })`
                  : user.phoneNumber.length >= 10
                  ? `${user.phoneNumber.slice(0, 4)}******${user.phoneNumber.slice(-2)}`
                  : user.phoneNumber}
              </span>
            </p>
            <p className="mt-1 text-xs font-medium text-zinc-500">
              Wallet balance
            </p>
            <p className="text-lg font-semibold text-zinc-900">
              {formatRupees(user.walletBalance)}
            </p>
            <a
              href="/wallet"
              className="mt-1 inline-flex items-center justify-center rounded-full border border-violet-200 bg-white px-3 py-1 text-xs font-medium text-violet-700 hover:bg-violet-50"
            >
              View wallet →
            </a>
            <div className="mt-1">
              <LogoutButton />
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-24 pt-4 sm:px-6">
        <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <h1 className="text-lg font-semibold text-zinc-900">
            Active games
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Join a game, lock your guess, and see if you can predict the crowd.
          </p>
        </section>

        <section>
          <GroupsList />
        </section>
      </main>
    </div>
  );
}

