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
  displayName?: string | null;
  address: string;
  bidCount: number;
  totalAmount: number;
  paymentStatus: string;
  joinedAt: string;
  isBot?: boolean;
};

type Group = {
  id: string;
  name: string;
  status: GroupStatus;
  closesAt: string;
  memberCount?: number;
  maxMembers?: number;
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
  const [botCount, setBotCount] = useState(1);
  const [addingBots, setAddingBots] = useState(false);

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
  const isOpen = group?.status === "OPEN" || group?.status === "FULL";
  const slotsLeft = group ? (group.maxMembers ?? 10) - members.length : 0;

  const fetchData = () => {
    if (!id) return;
    Promise.all([
      fetch(`/api/groups/${id}`).then((r) => r.json()),
      fetch(`/api/admin/groups/${id}/members`, {
        headers: { "x-admin-secret": secret },
      }).then((r) => r.json()),
    ]).then(([gData, mData]) => {
      if (!gData.error) setGroup(gData);
      if (!mData.error) setMembers(Array.isArray(mData) ? mData : []);
    });
  };

  const handleAddBots = async () => {
    if (!isOpen || addingBots || botCount < 1) return;
    setAddingBots(true);
    try {
      const res = await fetch(`/api/admin/groups/${id}/bots`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({ count: Math.min(botCount, slotsLeft) }),
      });
      const data = await res.json();
      if (res.ok) fetchData();
      else alert(data.error || "Failed");
    } finally {
      setAddingBots(false);
    }
  };

  const handleRunDraw = async () => {
    if (!id) return;
    if (
      !confirm(
        "Run draw now for this group? This will pick winners based on criteria."
      )
    )
      return;
    try {
      const res = await fetch(`/api/admin/groups/${id}/draw`, {
        method: "POST",
        headers: { "x-admin-secret": secret },
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error || "Failed to run draw");
      } else {
        fetchData();
      }
    } catch {
      alert("Failed to run draw");
    }
  };

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
          onClick={handleRunDraw}
          disabled={group.status === "DRAW_DONE" || group.status === "CANCELLED"}
          className="rounded-lg border border-emerald-200 px-4 py-2 text-sm font-medium text-emerald-700 hover:bg-emerald-50 dark:border-emerald-700 dark:text-emerald-300 dark:hover:bg-emerald-900/30 disabled:opacity-50"
        >
          {group.status === "DRAW_DONE" ? "Draw completed" : "Run draw now"}
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 disabled:opacity-50"
        >
          {deleting ? "Deleting..." : "Delete group"}
        </button>
      </div>

      {isOpen && slotsLeft > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/50">
          <span className="font-medium text-slate-700 dark:text-slate-300">Add bots</span>
          <input
            type="number"
            min={1}
            max={slotsLeft}
            value={botCount}
            onChange={(e) => setBotCount(Math.max(1, Math.min(slotsLeft, Number(e.target.value) || 1)))}
            className="w-16 rounded border border-slate-300 px-2 py-1 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
          <span className="text-sm text-slate-500">of {slotsLeft} slots left</span>
          <button
            type="button"
            onClick={handleAddBots}
            disabled={addingBots}
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {addingBots ? "Adding..." : "Add bots"}
          </button>
        </div>
      )}

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
                <th className="px-4 py-2 text-left">Mobile / Name</th>
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
                  <td className="px-4 py-2">
                    <span className="font-mono">{m.mobileNumber}</span>
                    {m.isBot && (
                      <span className="ml-2 rounded bg-slate-200 px-1.5 py-0.5 text-xs dark:bg-slate-600">Bot</span>
                    )}
                  </td>
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
