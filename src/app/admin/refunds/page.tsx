"use client";

import { useEffect, useState } from "react";
import { useAdminSecret } from "@/lib/admin-context";
import { formatRupees } from "@/lib/utils";

type RefundRow = {
  groupId: string;
  groupName: string;
  memberId: string;
  mobileNumber: string;
  displayName: string | null;
  amountToRefund: number;
  payerUpiId: string | null;
};

type RefundsData = {
  rows: RefundRow[];
  totalRefund: number;
  groupCount: number;
};

export default function AdminRefundsPage() {
  const secret = useAdminSecret();
  const [data, setData] = useState<RefundsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!secret) return;
    fetch("/api/admin/refunds", {
      headers: { "x-admin-secret": secret },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  }, [secret]);

  const exportCsv = () => {
    if (!data || data.rows.length === 0) return;
    const headers = "Group,Mobile,Name,Amount (₹),Payer UPI (refund to)\n";
    const lines = data.rows.map(
      (r) =>
        `"${r.groupName.replace(/"/g, '""')}",${r.mobileNumber},"${(r.displayName || "").replace(/"/g, '""')}",${r.amountToRefund},"${(r.payerUpiId || "").replace(/"/g, '""')}"`
    );
    const csv = headers + lines.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `refunds-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
        {error}
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Refunds (cancelled groups)
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Groups that didn’t fill by 7 PM — refund these members via UPI/bank manually. Export CSV to track.
          </p>
        </div>
        {data.rows.length > 0 && (
          <button
            type="button"
            onClick={exportCsv}
            className="rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 dark:border-emerald-500 dark:bg-emerald-600 dark:hover:bg-emerald-700"
          >
            Export CSV
          </button>
        )}
      </div>

      {data.rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-8 text-center dark:border-slate-700 dark:bg-slate-900">
          <p className="text-slate-500 dark:text-slate-400">
            No refunds pending. Cancelled groups with confirmed payments will appear here.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200">
              Total to refund: {formatRupees(data.totalRefund)} ({data.rows.length} entries across {data.groupCount} group(s))
            </p>
            <p className="mt-1 text-xs text-amber-700 dark:text-amber-300">
              When you confirmed the payment, if you entered the payer’s UPI (from your bank/app), it’s shown below — send refund to that UPI. Otherwise use mobile/bank.
            </p>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Group</th>
                  <th className="px-4 py-3 text-left font-medium">Mobile</th>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Payer UPI (refund to)</th>
                  <th className="px-4 py-3 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.rows.map((r) => (
                  <tr
                    key={`${r.groupId}-${r.memberId}`}
                    className="border-t border-slate-200 dark:border-slate-700"
                  >
                    <td className="px-4 py-2">{r.groupName}</td>
                    <td className="px-4 py-2 font-mono">{r.mobileNumber}</td>
                    <td className="px-4 py-2">{r.displayName || "—"}</td>
                    <td className="px-4 py-2 font-mono text-emerald-700 dark:text-emerald-400">
                      {r.payerUpiId || "—"}
                    </td>
                    <td className="px-4 py-2 text-right font-medium">
                      {formatRupees(r.amountToRefund)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
