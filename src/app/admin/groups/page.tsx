"use client";

import { useEffect, useState } from "react";
import { useAdminSecret } from "@/lib/admin-context";
import { formatRupees, formatDateTime, getStatusBadgeColor, getStatusLabel } from "@/lib/utils";
import type { GroupStatus } from "@prisma/client";

type Group = {
  id: string;
  name: string;
  status: GroupStatus;
  maxMembers: number;
  closesAt: string;
  createdAt?: string;
  memberCount: number;
  totalCollection: number;
  slotsLeft: number;
};

export default function AdminGroupsPage() {
  const secret = useAdminSecret();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [slots, setSlots] = useState(500);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchGroups = () => {
    setLoading(true);
    fetch("/api/admin/groups", {
      headers: { "x-admin-secret": secret },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else {
          setGroups(Array.isArray(data) ? data : []);
          const today = new Date().toDateString();
          const todayCount = (Array.isArray(data) ? data : []).filter(
            (g: Group) => g.createdAt && new Date(g.createdAt).toDateString() === today
          ).length;
          setNewName((prev) => (prev.trim() === "" ? `Group ${todayCount + 1}` : prev));
        }
      })
      .catch(() => setError("Failed to load"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (!secret) return;
    fetchGroups();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [secret]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || creating) return;
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/groups", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({ name: newName.trim(), maxMembers: slots }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed");
        return;
      }
      setNewName("");
      fetchGroups();
    } catch {
      setError("Network error");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (groupId: string, groupName: string) => {
    if (!confirm(`Delete group "${groupName}"? This will remove all members and payments.`)) return;
    setDeletingId(groupId);
    try {
      const res = await fetch(`/api/admin/groups/${groupId}`, {
        method: "DELETE",
        headers: { "x-admin-secret": secret },
      });
      if (res.ok) fetchGroups();
      else setError("Failed to delete");
    } catch {
      setError("Failed to delete");
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-violet-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
        <h3 className="font-medium text-slate-900 dark:text-white">
          Create Group
        </h3>
        <form onSubmit={handleCreate} className="mt-3 space-y-3">
          <div className="flex flex-wrap gap-2">
            <input
              type="text"
              placeholder="Group name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="min-w-[140px] flex-1 rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
            />
            <label className="flex items-center gap-2 rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-600 dark:bg-slate-800">
              <span className="text-sm text-slate-600 dark:text-slate-400">Slots</span>
              <input
                type="number"
                min={10}
                max={10000}
                value={slots}
                onChange={(e) => setSlots(Math.max(10, Math.min(10000, Number(e.target.value) || 500)))}
                className="w-20 rounded border-0 bg-transparent py-0 text-right dark:text-white"
              />
            </label>
            <button
              type="submit"
              disabled={creating}
              className="rounded-lg bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-700 disabled:opacity-50"
            >
              {creating ? "..." : "Create"}
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Name auto-fills as Group 1, Group 2, etc. for today. You can change it. Slots = max members (10–10000).
          </p>
        </form>
        {error && (
          <p className="mt-2 text-sm text-red-600 dark:text-red-400">{error}</p>
        )}
      </div>

      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        <h3 className="border-b border-slate-200 px-4 py-3 font-medium dark:border-slate-700">
          All Groups
        </h3>
        <div className="divide-y divide-slate-200 dark:divide-slate-700">
          {groups.length === 0 ? (
            <p className="px-4 py-8 text-center text-slate-500">
              No groups yet
            </p>
          ) : (
            groups.map((g) => (
              <div
                key={g.id}
                className="flex items-center justify-between gap-4 px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800"
              >
                <a
                  href={`/admin/groups/${g.id}`}
                  className="min-w-0 flex-1"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {g.name}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Closes {formatDateTime(new Date(g.closesAt))}
                      </p>
                      <span
                        className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(g.status)}`}
                      >
                        {getStatusLabel(g.status)}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {g.memberCount} / {g.maxMembers ?? 500}
                      </p>
                      <p className="text-sm text-emerald-600">
                        {formatRupees(g.totalCollection)}
                      </p>
                    </div>
                  </div>
                </a>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleDelete(g.id, g.name);
                  }}
                  disabled={deletingId === g.id}
                  className="shrink-0 rounded-lg border border-red-200 px-3 py-1.5 text-sm text-red-600 hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30 disabled:opacity-50"
                >
                  {deletingId === g.id ? "..." : "Delete"}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
