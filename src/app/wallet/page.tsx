import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatRupees } from "@/lib/utils";

export const dynamic = "force-dynamic";

async function getWalletData() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }
  const transactions = await prisma.transaction.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });
  return { user, transactions };
}

export default async function WalletPage() {
  const { user, transactions } = await getWalletData();

  return (
    <div className="mx-auto min-h-screen max-w-2xl bg-zinc-50 px-4 py-8 sm:px-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            Wallet
          </h1>
          <p className="mt-1 text-sm text-zinc-600">
            Add cash to play more games or withdraw your winnings.
          </p>
        </div>
        <a
          href="/lobby"
          className="inline-flex items-center rounded-full border border-zinc-300 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
        >
          ← Back to lobby
        </a>
      </div>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <p className="text-sm font-medium text-zinc-500">Current balance</p>
        <p className="mt-1 text-3xl font-semibold text-zinc-900">
          {formatRupees(user.walletBalance)}
        </p>
        <div className="mt-4 flex gap-3">
          <a
            href="#add-cash"
            className="inline-flex flex-1 items-center justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
          >
            Add Cash
          </a>
          <a
            href="#withdraw"
            className="inline-flex flex-1 items-center justify-center rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
          >
            Withdraw
          </a>
        </div>
      </section>

      <WalletForms />

      <section className="mt-8 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
          Recent activity
        </h2>
        {transactions.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            No wallet activity yet. Add cash or play a game to see history.
          </p>
        ) : (
          <ul className="mt-4 space-y-3 text-sm">
            {transactions.map((t) => (
              <li
                key={t.id}
                className="flex items-center justify-between rounded-lg border border-zinc-200 px-3 py-2"
              >
                <div>
                  <p className="font-medium text-zinc-900">{t.type}</p>
                  <p className="text-xs text-zinc-500">
                    {new Date(t.createdAt).toLocaleString("en-IN")}
                  </p>
                </div>
                <p
                  className={
                    t.amount >= 0
                      ? "text-sm font-semibold text-emerald-700"
                      : "text-sm font-semibold text-red-700"
                  }
                >
                  {t.amount >= 0 ? "+" : "-"}
                  {formatRupees(Math.abs(t.amount))}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function WalletForms() {
  return (
    <div className="mt-8 grid gap-4 md:grid-cols-2">
      <WalletAddCashForm />
      <WalletWithdrawForm />
    </div>
  );
}

function WalletAddCashForm() {
  async function addCash(formData: FormData) {
    "use server";
    const amount = Number(formData.get("amount"));
    if (!Number.isFinite(amount) || amount <= 0) return;

    const user = await getCurrentUser();
    if (!user) {
      redirect("/login");
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        walletBalance: { increment: amount },
        transactions: {
          create: {
            type: "ADD_CASH",
            amount,
            meta: { source: "mock" },
          },
        },
      },
    });

    revalidatePath("/wallet");
  }

  return (
    <section
      id="add-cash"
      className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
        Add cash
      </h2>
      <form action={addCash} className="mt-4 space-y-3">
        <div>
          <label
            htmlFor="add-amount"
            className="block text-sm font-medium text-zinc-700"
          >
            Amount (₹)
          </label>
          <input
            id="add-amount"
            name="amount"
            type="number"
            min={10}
            step={10}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            placeholder="200"
          />
        </div>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-lg bg-violet-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-violet-700"
        >
          Add cash (mock)
        </button>
      </form>
    </section>
  );
}

function WalletWithdrawForm() {
  async function withdraw(formData: FormData) {
    "use server";
    const amount = Number(formData.get("amount"));
    const upiId = String(formData.get("upiId") || "");
    if (!Number.isFinite(amount) || amount <= 0 || !upiId) return;

    const user = await getCurrentUser();
    if (!user) {
      redirect("/login");
    }

    if (user.walletBalance < amount) {
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        walletBalance: { decrement: amount },
        transactions: {
          create: {
            type: "WITHDRAW",
            amount: -amount,
            meta: { upiId, mock: true },
          },
        },
      },
    });

    revalidatePath("/wallet");
  }

  return (
    <section
      id="withdraw"
      className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm"
    >
      <h2 className="text-sm font-semibold uppercase tracking-widest text-zinc-500">
        Withdraw
      </h2>
      <form action={withdraw} className="mt-4 space-y-3">
        <div>
          <label
            htmlFor="withdraw-amount"
            className="block text-sm font-medium text-zinc-700"
          >
            Amount (₹)
          </label>
          <input
            id="withdraw-amount"
            name="amount"
            type="number"
            min={10}
            step={10}
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            placeholder="200"
          />
        </div>
        <div>
          <label
            htmlFor="upiId"
            className="block text-sm font-medium text-zinc-700"
          >
            UPI ID
          </label>
          <input
            id="upiId"
            name="upiId"
            type="text"
            className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-violet-500 focus:outline-none focus:ring-2 focus:ring-violet-500/20"
            placeholder="name@bank"
          />
        </div>
        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-zinc-800"
        >
          Request withdraw (mock)
        </button>
      </form>
    </section>
  );
}

