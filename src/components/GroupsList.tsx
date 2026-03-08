"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatRupees, formatDateTime, getStatusBadgeColor, getStatusLabel } from "@/lib/utils";
import type { GroupStatus } from "@prisma/client";

type RecentJoin = {
  displayName: string;
  joinedAt: string;
  bidCount: number;
};

type Group = {
  id: string;
  name: string;
  maxMembers: number;
  entryFee: number;
  status: GroupStatus;
  closesAt: string;
  memberCount: number;
  slotsLeft: number;
  recentJoins?: RecentJoin[];
};

export function GroupsList() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/groups")
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setGroups(Array.isArray(data) ? data : []);
      })
      .catch(() => setError("Failed to load groups"))
      .finally(() => setLoading(false));
  }, []);

  const formatRecentTime = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return "just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return d.toLocaleDateString();
  };

  const formatTimeLeft = (closesAt: string) => {
    const end = new Date(closesAt).getTime();
    const now = Date.now();
    const diff = end - now;
    if (diff <= 0) return "Closing soon";
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    if (hours <= 0) return `${remMinutes} min left`;
    return `${hours}h ${remMinutes}m left`;
  };

  if (loading) {
    return (
      <div className="flex justify-center py-16">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-800">
        {error}
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-12 text-center shadow-sm">
        <p className="text-zinc-500">
          No open groups right now. New groups will appear here when they go
          live.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
      {groups.map((g) => (
        <Link
          key={g.id}
          href={`/join/${g.id}`}
          className="group block rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:shadow-md"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-zinc-900">{g.name}</h3>
              <p className="mt-1 text-sm text-zinc-500">
                Closes {formatDateTime(new Date(g.closesAt))} •{" "}
                {formatTimeLeft(g.closesAt)}
              </p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusBadgeColor(g.status)}`}
                >
                  {getStatusLabel(g.status)}
                </span>
                <span className="text-xs text-zinc-500">
                  {g.memberCount} / {g.maxMembers} members
                </span>
              </div>
              <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
                <div
                  className="h-full rounded-full bg-zinc-600 transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      Math.round((g.memberCount / g.maxMembers) * 100)
                    )}%`,
                  }}
                />
              </div>
              {g.recentJoins && g.recentJoins.length > 0 && (
                <div className="mt-3 border-t border-zinc-100 pt-3">
                  <p className="text-xs font-medium text-zinc-500">Recent joins</p>
                  <ul className="mt-1 space-y-0.5 text-xs text-zinc-600">
                    {g.recentJoins.map((j, i) => (
                      <li key={i}>
                        <span className="font-medium text-zinc-800">{j.displayName}</span>
                        {" added with "}
                        <span className="font-medium text-zinc-800">{j.bidCount ?? 1}</span>
                        {j.bidCount === 1 ? " bid " : " bids "}
                        <span className="text-zinc-500">{formatRecentTime(j.joinedAt)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs uppercase tracking-widest text-zinc-500">
                Entry
              </p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">
                {formatRupees(g.entryFee)}
              </p>
              <p className="mt-1 text-xs text-zinc-500">{g.slotsLeft} slots left</p>
            </div>
          </div>
          <div className="mt-4 flex w-full items-center justify-center rounded-xl bg-violet-600 px-4 py-3 text-sm font-semibold text-white shadow-md shadow-violet-600/20 transition group-hover:bg-violet-700 group-hover:shadow-violet-600/30">
            Join this group →
          </div>
        </Link>
      ))}
    </div>
  );
}
