"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatRupees, formatDateTime, getStatusBadgeColor, getStatusLabel } from "@/lib/utils";
import type { GroupStatus } from "@prisma/client";

type RecentJoin = {
  displayName: string;
  joinedAt: string;
  bidCount: number;
};

type Criterion = { id: string; label: string; type: string; value?: number };

type Group = {
  id: string;
  name: string;
  maxMembers: number;
  entryFee: number;
  status: GroupStatus;
  closesAt: string;
  memberCount: number;
  slotsLeft: number;
  criteriaKind?: "age" | "state";
  criteria?: Criterion[];
  recentJoins?: RecentJoin[];
};

export function GroupsList() {
  const router = useRouter();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [joiningId, setJoiningId] = useState<string | null>(null);

  useEffect(() => {
    const load = () => {
      fetch("/api/groups")
        .then((r) => r.json())
        .then((data) => {
          if (data?.error) setError(String(data.error));
          else {
            const list = Array.isArray(data) ? data : [];
            setGroups(
              list.filter(
                (g: unknown): g is Group =>
                  g != null &&
                  typeof g === "object" &&
                  "id" in g &&
                  "closesAt" in g &&
                  "maxMembers" in g
              )
            );
          }
        })
        .catch(() => setError("Failed to load groups"))
        .finally(() => setLoading(false));
    };

    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
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

  async function handleJoinClick(
    e: React.MouseEvent,
    group: Group,
    isExpired: boolean
  ) {
    if (
      group.status !== "OPEN" ||
      group.slotsLeft <= 0 ||
      isExpired ||
      joiningId
    ) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setError(null);
    setJoiningId(group.id);
    try {
      const res = await fetch(`/api/games/${group.id}/join`, {
        method: "POST",
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.code === "INSUFFICIENT_BALANCE") {
          setError("Not enough wallet balance. Add cash in your wallet.");
        } else if (data.error) {
          setError(data.error);
        } else {
          setError("Failed to join game.");
        }
        return;
      }
      router.push(`/game/${group.id}`);
    } catch {
      setError("Failed to join game.");
    } finally {
      setJoiningId(null);
    }
  }

  return (
    <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
      {groups.map((g) => {
        const maxMembers = Number(g.maxMembers) || 1;
        const memberCount = Number(g.memberCount) || 0;
        const closesAt = g.closesAt != null ? String(g.closesAt) : "";
        const isExpired = closesAt ? new Date(closesAt).getTime() <= now : true;
        const fillPercent = Math.min(
          100,
          Math.round((memberCount / maxMembers) * 100)
        );
        const showResultsOverlay =
          g.slotsLeft === 0 && !isExpired && g.status !== "DRAW_DONE";
        const resultsInTime = closesAt
          ? formatTimeLeft(closesAt).replace(/\s+left$/, "").toLowerCase()
          : "soon";

        return (
          <div
            key={g.id}
            className="group relative block rounded-2xl bg-gradient-to-br from-violet-50 to-fuchsia-50 p-[1px] shadow-sm transition hover:shadow-md"
          >
            {showResultsOverlay && (
              <div className="absolute inset-x-0 top-0 z-10 flex items-center justify-center rounded-t-2xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-3 text-center shadow-md">
                <p className="text-sm font-semibold text-white">
                  View results in {resultsInTime}
                </p>
              </div>
            )}
            <div className={`h-full rounded-2xl border border-zinc-200 bg-white p-5 ${showResultsOverlay ? "pt-14" : ""}`}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2 py-0.5 font-medium text-violet-800">
                  <span className="text-[10px]">✨</span> Guess &amp; win
                </span>
                <span className="text-[11px] text-zinc-500">
                  {isExpired ? "Time's up" : closesAt ? formatTimeLeft(closesAt) : "—"}
                  {(g.slotsLeft ?? 0) > 0 && ` • ${g.slotsLeft} slots left`}
                </span>
              </div>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-base font-semibold text-zinc-900">
                    {g.name}
                  </h3>
                  <p className="mt-1 text-xs text-zinc-500">
                    Closes {closesAt ? formatDateTime(new Date(closesAt)) : "—"}
                  </p>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-0.5 text-[11px] font-medium ${getStatusBadgeColor(
                        (g.status as GroupStatus) ?? "CLOSED"
                      )}`}
                    >
                      {getStatusLabel((g.status as GroupStatus) ?? "CLOSED")}
                    </span>
                    <span className="text-[11px] text-zinc-500">
                      {memberCount} / {maxMembers} joined
                    </span>
                    {g.criteriaKind && (
                      <span className="text-[11px] font-medium text-violet-600">
                        {g.criteriaKind === "age" ? "Guess the Age" : "Guess the State"}
                      </span>
                    )}
                  </div>
                  <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-zinc-200">
                    <div
                      className="h-full rounded-full bg-violet-500 transition-all"
                      style={{ width: `${fillPercent}%` }}
                    />
                  </div>
                  {Array.isArray(g.recentJoins) && g.recentJoins.length > 0 && (
                    <p className="mt-2 text-[11px] text-zinc-500">
                      <span className="font-medium text-zinc-800">
                        {g.recentJoins[0]?.displayName ?? "A player"}
                      </span>{" "}
                      joined {formatRecentTime(g.recentJoins[0]?.joinedAt ?? new Date().toISOString())}
                      {g.recentJoins.length > 1 && (
                        <> &middot; +{g.recentJoins.length - 1} more</>
                      )}
                    </p>
                  )}
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-[11px] uppercase tracking-widest text-zinc-500">
                    Entry
                  </p>
                  <p className="mt-1 text-lg font-semibold text-zinc-900">
                    {formatRupees(Number(g.entryFee) || 0)}
                  </p>
                </div>
              </div>
              {g.status === "DRAW_DONE" ? (
                <button
                  type="button"
                  onClick={() => router.push(`/join/${g.id}/results`)}
                  className="mt-4 flex w-full items-center justify-center rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/30 transition hover:bg-emerald-700"
                >
                  View results →
                </button>
              ) : (
                <button
                  type="button"
                  onClick={(e) => handleJoinClick(e, g, isExpired)}
                  disabled={
                    joiningId === g.id ||
                    !(g.status === "OPEN" && g.slotsLeft > 0 && !isExpired)
                  }
                  className={`mt-4 flex w-full items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold shadow-md shadow-violet-600/20 transition ${
                    g.status === "OPEN" && g.slotsLeft > 0 && !isExpired
                      ? "bg-violet-600 text-white group-hover:bg-violet-700 group-hover:shadow-violet-600/30 disabled:cursor-not-allowed disabled:opacity-70"
                      : "bg-zinc-200 text-zinc-500 cursor-default"
                  }`}
                >
                  {g.status === "OPEN" && g.slotsLeft > 0 && !isExpired
                    ? joiningId === g.id
                      ? "Joining..."
                      : "Join this game →"
                    : isExpired
                    ? "Time's up – game closed"
                    : "Game filled / closed"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
