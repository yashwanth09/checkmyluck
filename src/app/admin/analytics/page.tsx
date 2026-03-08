"use client";

import { useEffect, useState } from "react";
import { useAdminSecret } from "@/lib/admin-context";
import { formatRupees, formatDateTime, getStatusBadgeColor, getStatusLabel } from "@/lib/utils";
import { ENTRY_FEE, REFUND_AMOUNT } from "@/lib/constants";
import type { GroupStatus } from "@prisma/client";

type GroupRow = {
  id: string;
  name: string;
  status: GroupStatus;
  createdAt: string;
  collection: number;
  refundCount: number;
  refundAmount: number;
  income: number;
};

type AnalyticsData = {
  summary: {
    totalIncome: number;
    todayIncome: number;
    incomeFromDraws: number;
    incomeFromCancelled: number;
    targetPerGroup: number;
    groupCount: number;
  };
  groups: GroupRow[];
};

const REFRESH_SECONDS = 30;

export default function AdminAnalyticsPage() {
  const secret = useAdminSecret();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAnalytics = () => {
    fetch("/api/admin/analytics", {
      headers: { "x-admin-secret": secret },
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.error) setError(d.error);
        else setData(d);
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!secret) return;
    setLoading(true);
    fetchAnalytics();
  }, [secret]);

  useEffect(() => {
    if (!secret || !data) return;
    const id = setInterval(fetchAnalytics, REFRESH_SECONDS * 1000);
    return () => clearInterval(id);
  }, [secret, data]);

  if (loading && !data) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800 dark:border-red-800 dark:bg-red-900/20 dark:text-red-200">
        {error || "No data"}
      </div>
    );
  }

  const { summary, groups } = data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            Income analytics
          </h2>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Refund = ₹{REFUND_AMOUNT} per person when group is cancelled (you keep ₹{ENTRY_FEE - REFUND_AMOUNT}). Target ₹{summary.targetPerGroup.toLocaleString()} per group after refunds. Auto-refresh every {REFRESH_SECONDS}s.
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setLoading(true); fetchAnalytics(); }}
          className="rounded-lg border border-slate-300 px-4 py-2 text-sm font-medium dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        >
          Refresh now
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Total income</p>
          <p className="text-2xl font-bold text-emerald-600">
            {formatRupees(summary.totalIncome)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Today</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {formatRupees(summary.todayIncome)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500">From draws</p>
          <p className="text-xl font-bold text-violet-600">
            {formatRupees(summary.incomeFromDraws)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500">From refunds (₹10/person)</p>
          <p className="text-xl font-bold text-amber-600">
            {formatRupees(summary.incomeFromCancelled)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Target per group</p>
          <p className="text-xl font-bold text-slate-700 dark:text-slate-300">
            {formatRupees(summary.targetPerGroup)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <h3 className="border-b border-slate-200 px-4 py-3 font-medium dark:border-slate-700">
          Groups — collection & income (real-time)
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-slate-200 bg-slate-50 dark:border-slate-700 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Group</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-right font-medium">Collection</th>
                <th className="px-4 py-3 text-right font-medium">Refund (₹240 × N)</th>
                <th className="px-4 py-3 text-right font-medium">Income</th>
              </tr>
            </thead>
            <tbody>
              {groups.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No groups yet
                  </td>
                </tr>
              ) : (
                groups.map((g) => (
                  <tr
                    key={g.id}
                    className="border-t border-slate-200 dark:border-slate-700"
                  >
                    <td className="px-4 py-2">
                      <a
                        href={`/admin/groups/${g.id}`}
                        className="font-medium text-violet-600 hover:underline dark:text-violet-400"
                      >
                        {g.name}
                      </a>
                      <p className="text-xs text-slate-500">
                        {formatDateTime(new Date(g.createdAt))}
                      </p>
                    </td>
                    <td className="px-4 py-2">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getStatusBadgeColor(g.status)}`}
                      >
                        {getStatusLabel(g.status)}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right font-mono">
                      {formatRupees(g.collection)}
                    </td>
                    <td className="px-4 py-2 text-right font-mono text-amber-600">
                      {g.refundCount > 0
                        ? `${formatRupees(g.refundAmount)} (${g.refundCount})`
                        : "—"}
                    </td>
                    <td className="px-4 py-2 text-right font-mono font-semibold text-emerald-600">
                      {formatRupees(g.income)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
