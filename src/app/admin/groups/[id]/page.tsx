"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAdminSecret } from "@/lib/admin-context";
import { formatRupees, formatDateTime, getStatusBadgeColor, getStatusLabel } from "@/lib/utils";
import type { GroupStatus } from "@prisma/client";

type Member = {
  id: string;
  mobileNumber: string;
  address: string;
  bidCount: number;
  totalAmount: number;
  paymentStatus: string;
  joinedAt: string;
};

type Group = {
  id: string;
  name: string;
  status: GroupStatus;
  closesAt: string;
  memberCount?: number;
};

export default function AdminGroupDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const secret = useAdminSecret();
  const [group, setGroup] = useState<Group | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!secret || !id) return;
    Promise.all([
      fetch(`/api/groups/${id}`).then((r) => r.json()),
      fetch(`/api/admin/groups/${id}/members`, {
        headers: { "x-admin-secret": secret },
      }).then((r) => r.json()),
    ]).then(([gData, mData]) => {
      if (!gData.error) setGroup(gData);
      if (!mData.error) setMembers(Array.isArray(mData) ? mData : []);
    }).finally(() => setLoading(false));
  }, [secret, id]);

  if (loading || !group) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  const confirmed = members.filter((m) => m.paymentStatus === "CONFIRMED");

  const handleDelete = async () => {
    if (!confirm(`Delete "${group.name}"? This will remove all members and payments.`)) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/groups/${id}`, {
        method: "DELETE",
        headers: { "x-admin-secret": secret },
      });
      if (res.ok) router.push("/admin/groups");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-4">
        <Link
          href="/admin/groups"
          className="text-violet-600 hover:text-violet-700 dark:text-violet-400"
        >
          ← Back
        </Link>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
            {group.name}
          </h2>
          <div className="mt-1 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(group.status)}`}
            >
              {getStatusLabel(group.status)}
            </span>
            <span className="text-sm text-slate-500">
              Closes {formatDateTime(new Date(group.closesAt))}
            </span>
          </div>
        </div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete group"}
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Total Members</p>
          <p className="text-2xl font-bold">{members.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
          <p className="text-sm text-slate-500">Confirmed Payments</p>
          <p className="text-2xl font-bold text-emerald-600">
            {formatRupees(confirmed.reduce((s, m) => s + m.totalAmount, 0))}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <h3 className="border-b border-slate-200 px-4 py-3 font-medium dark:border-slate-700">
          Members ({members.length})
        </h3>
        <div className="max-h-96 overflow-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800">
              <tr>
                <th className="px-4 py-2 text-left">Mobile</th>
                <th className="px-4 py-2 text-left">Bids</th>
                <th className="px-4 py-2 text-left">Amount</th>
                <th className="px-4 py-2 text-left">Status</th>
                <th className="px-4 py-2 text-left">Joined</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr
                  key={m.id}
                  className="border-t border-slate-200 dark:border-slate-700"
                >
                  <td className="px-4 py-2 font-mono">{m.mobileNumber}</td>
                  <td className="px-4 py-2">{m.bidCount}</td>
                  <td className="px-4 py-2">{formatRupees(m.totalAmount)}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        m.paymentStatus === "CONFIRMED"
                          ? "text-emerald-600"
                          : "text-amber-600"
                      }
                    >
                      {m.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-slate-500">
                    {formatDateTime(new Date(m.joinedAt))}
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
