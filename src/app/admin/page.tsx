"use client";

import { useEffect, useState } from "react";
import { useAdminSecret } from "@/lib/admin-context";
import { formatRupees } from "@/lib/utils";

type Summary = {
  date: string;
  groupsCount: number;
  membersCount: number;
  totalCollection: number;
  totalPending: number;
  totalExpected: number;
  groups: { id: string; name: string; memberCount: number; status: string }[];
};

export default function AdminDashboard() {
  const secret = useAdminSecret();
  const [summary, setSummary] = useState<Summary | null>(null);
  const [date, setDate] = useState(() =>
    new Date().toISOString().slice(0, 10)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!secret) return;
    setLoading(true);
    fetch(`/api/admin/summary?date=${date}`, {
      headers: { "x-admin-secret": secret },
    })
      .then((r) => r.json())
      .then(setSummary)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [secret, date]);

  if (loading || !summary) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
          Daily Summary
        </h2>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="rounded-lg border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Groups</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {summary.groupsCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Members</p>
          <p className="text-2xl font-bold text-slate-900 dark:text-white">
            {summary.membersCount}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Confirmed</p>
          <p className="text-2xl font-bold text-emerald-600">
            {formatRupees(summary.totalCollection)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Pending</p>
          <p className="text-2xl font-bold text-amber-600">
            {formatRupees(summary.totalPending)}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <h3 className="border-b border-slate-200 px-4 py-3 font-medium dark:border-slate-700">
          Groups
        </h3>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {summary.groups.length === 0 ? (
            <p className="px-4 py-8 text-center text-slate-500">
              No groups for this date
            </p>
          ) : (
            summary.groups.map((g) => (
              <a
                key={g.id}
                href={`/admin/groups/${g.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <span className="font-medium">{g.name}</span>
                <span className="text-sm text-slate-500">
                  {g.memberCount} members • {g.status}
                </span>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
