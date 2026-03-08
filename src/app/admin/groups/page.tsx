"use client";

import { useEffect, useState } from "react";
import { useAdminSecret } from "@/lib/admin-context";
import { formatRupees, formatDateTime, getStatusBadgeColor, getStatusLabel } from "@/lib/utils";
import type { GroupStatus } from "@prisma/client";

type Group = {
  id: string;
  name: string;
  status: GroupStatus;
  closesAt: string;
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
  const [error, setError] = useState<string | null>(null);

  const fetchGroups = () => {
    setLoading(true);
    fetch("/api/admin/groups", {
      headers: { "x-admin-secret": secret },
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setGroups(Array.isArray(data) ? data : []);
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
        body: JSON.stringify({ name: newName.trim() }),
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
        <form onSubmit={handleCreate} className="mt-3 flex gap-2">
          <input
            type="text"
            placeholder="Group name (e.g. iPhone Draw - Mar 8)"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 rounded-lg border border-slate-300 px-4 py-2 dark:border-slate-600 dark:bg-slate-800 dark:text-white"
          />
          <button
            type="submit"
            disabled={creating}
            className="rounded-lg bg-violet-600 px-4 py-2 font-medium text-white hover:bg-violet-700 disabled:opacity-50"
          >
            {creating ? "..." : "Create"}
          </button>
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
              <a
                key={g.id}
                href={`/admin/groups/${g.id}`}
                className="block px-4 py-4 hover:bg-slate-50 dark:hover:bg-slate-800"
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
                      {g.memberCount} / 500
                    </p>
                    <p className="text-sm text-emerald-600">
                      {formatRupees(g.totalCollection)}
                    </p>
                  </div>
                </div>
              </a>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
