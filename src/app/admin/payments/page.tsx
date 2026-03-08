"use client";

import { useEffect, useState } from "react";
import { useAdminSecret } from "@/lib/admin-context";
import { formatRupees, formatDateTime } from "@/lib/utils";

type Payment = {
  id: string;
  amount: number;
  status: string;
  referenceId: string | null;
  payerUpiId: string | null;
  createdAt: string;
  member: { mobileNumber: string; bidCount: number };
  group: { name: string };
};

type PaymentsData = {
  payments: Payment[];
  summary: {
    totalPending: number;
    totalConfirmed: number;
    totalCollection: number;
    count: number;
  };
};

export default function AdminPaymentsPage() {
  const secret = useAdminSecret();
  const [data, setData] = useState<PaymentsData | null>(null);
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [payerUpiFor, setPayerUpiFor] = useState<Record<string, string>>({});

  const fetchPayments = () => {
    fetch(`/api/admin/payments?date=${date}`, {
      headers: { "x-admin-secret": secret },
    })
      .then((r) => r.json())
      .then((d) => {
        if (!d.error) setData(d);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!secret) return;
    setLoading(true);
    fetchPayments();
  }, [secret, date]);

  const handleConfirm = async (paymentId: string) => {
    setConfirming(paymentId);
    const payerUpiId = payerUpiFor[paymentId]?.trim() || undefined;
    try {
      const res = await fetch(`/api/admin/payments/${paymentId}/confirm`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({ payerUpiId: payerUpiId || null }),
      });
      if (res.ok) {
        setPayerUpiFor((prev) => ({ ...prev, [paymentId]: "" }));
        fetchPayments();
      }
    } finally {
      setConfirming(null);
    }
  };

  if (loading || !data) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  const pending = data.payments.filter((p) => p.status === "PENDING");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Payments
        </h2>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Confirmed</p>
          <p className="text-2xl font-bold text-emerald-600">
            {formatRupees(data.summary.totalConfirmed)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Pending</p>
          <p className="text-2xl font-bold text-amber-600">
            {formatRupees(data.summary.totalPending)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Total</p>
          <p className="text-2xl font-bold">
            {formatRupees(data.summary.totalCollection)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <h3 className="border-b border-slate-200 px-4 py-3 font-medium dark:border-slate-700">
          Pending Confirmations ({pending.length})
        </h3>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {pending.length === 0 ? (
            <p className="px-4 py-8 text-center text-slate-500">
              No pending payments
            </p>
          ) : (
            pending.map((p) => (
              <div
                key={p.id}
                className="flex flex-wrap items-center justify-between gap-4 px-4 py-3 sm:flex-nowrap"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-mono text-slate-900 dark:text-white">
                    {p.member.mobileNumber}
                  </p>
                  <p className="text-sm text-slate-500">
                    {p.group.name} • {p.member.bidCount} bid(s) • Ref:{" "}
                    {p.referenceId}
                  </p>
                  <input
                    type="text"
                    placeholder="Payer UPI (from bank/app — for refunds)"
                    value={payerUpiFor[p.id] ?? ""}
                    onChange={(e) =>
                      setPayerUpiFor((prev) => ({ ...prev, [p.id]: e.target.value }))
                    }
                    className="mt-2 w-full max-w-xs rounded border border-slate-300 px-2 py-1 text-xs font-mono dark:border-slate-600 dark:bg-slate-800 dark:text-white"
                  />
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span className="font-semibold">
                    {formatRupees(p.amount)}
                  </span>
                  <button
                    onClick={() => handleConfirm(p.id)}
                    disabled={confirming === p.id}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {confirming === p.id ? "..." : "Confirm"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <h3 className="border-b border-slate-200 px-4 py-3 font-medium dark:border-slate-700">
          All Payments ({data.payments.length})
        </h3>
        <div className="max-h-80 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-2 text-left">Mobile</th>
                <th className="px-4 py-2 text-left">Group</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.payments.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-slate-200 dark:border-slate-700"
                >
                  <td className="px-4 py-2 font-mono">{p.member.mobileNumber}</td>
                  <td className="px-4 py-2">{p.group.name}</td>
                  <td className="px-4 py-2">{formatRupees(p.amount)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        p.status === "CONFIRMED"
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }
                    >
                      {p.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {formatDateTime(new Date(p.createdAt))}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
