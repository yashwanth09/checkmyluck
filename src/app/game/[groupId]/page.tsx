import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { formatRupees } from "@/lib/utils";
import { LockGuessClient } from "./LockGuessClient";
import { GameTimer } from "./GameTimer";
import { GameResultsInline } from "./GameResultsInline";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ groupId: string }>;
};

async function getGameData(groupId: string) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/login");
  }

  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      criteria: { orderBy: { order: "asc" } },
      members: {
        orderBy: { joinedAt: "asc" },
        select: {
          id: true,
          userId: true,
          isBot: true,
          displayName: true,
          joinedAt: true,
          selectedCriterionId: true,
          guessLockedAt: true,
        },
      },
    },
  });

  if (!group) {
    redirect("/lobby");
  }

  const myMember = group.members.find((m) => m.userId === user.id) || null;

  return { user, group, myMember };
}

export default async function GameLobbyPage({ params }: PageProps) {
  const { groupId } = await params;
  const { user, group, myMember } = await getGameData(groupId);

  const totalJoined = group.members.length;
  const slotsLeft = group.maxMembers - totalJoined;

  const myLocked = !!myMember?.guessLockedAt;

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-violet-200/60 bg-gradient-to-r from-violet-50 via-white to-fuchsia-50/80 shadow-sm backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-4 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-700">
              Game lobby
            </p>
            <h1 className="text-sm font-medium text-zinc-800">
              {group.name}
            </h1>
            <p className="mt-1 text-xs text-zinc-600">
              Entry {formatRupees(group.entryFee)} •{" "}
              {group.maxMembers} players max
            </p>
          </div>
          <div className="text-right">
            <p className="text-xs font-medium text-zinc-500">Time left</p>
            <p className="text-lg font-semibold text-zinc-900">
              <GameTimer closesAt={group.closesAt.toString()} />
            </p>
            <p className="mt-1 text-xs text-zinc-600">
              {slotsLeft} slots left
            </p>
            <a
              href="/lobby"
              className="mt-2 inline-flex items-center justify-center rounded-full border border-zinc-300 bg-white px-3 py-1 text-[11px] font-medium text-zinc-700 shadow-sm hover:bg-zinc-50"
            >
              ← Back to lobby
            </a>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-4 pb-24 pt-4 sm:px-6">
        <section className="mb-6 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          <p className="text-sm font-medium text-zinc-800">
            Waiting room
          </p>
          <p className="mt-1 text-xs text-zinc-600">
            You and other players are joining. When the timer ends or the
            game fills, the result will be calculated based on everyone&apos;s
            attributes.
          </p>

          <div className="mt-4 grid grid-cols-5 gap-2 text-center text-xs sm:grid-cols-8">
            {group.members.map((m) => (
              <div
                key={m.id}
                className={`flex h-10 items-center justify-center rounded-lg border ${
                  m.userId === user.id
                    ? "border-violet-500 bg-violet-50 text-violet-800"
                    : "border-zinc-200 bg-white text-zinc-700"
                }`}
              >
                {m.userId === user.id
                  ? "You"
                  : m.displayName?.slice(0, 6) || "Player"}
              </div>
            ))}
            {Array.from({ length: Math.max(0, slotsLeft) }).map((_, i) => (
              <div
                key={`empty-${i}`}
                className="flex h-10 items-center justify-center rounded-lg border border-dashed border-zinc-200 text-zinc-300"
              >
                Slot
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
          {(group.status === "OPEN" || group.status === "FULL") && (
            <>
              <p className="text-sm font-semibold text-zinc-900">
                Lock your guess
              </p>
              <p className="mt-1 text-xs text-zinc-600">
                Who do you think most players in this game will be?
              </p>

              {group.criteria.length === 0 ? (
                <p className="mt-3 text-sm text-amber-700">
                  This game has no prediction options configured yet.
                </p>
              ) : (
                <LockGuessClient
                  groupId={group.id}
                  criteria={group.criteria.map((c) => ({
                    id: c.id,
                    label: c.label,
                    type: c.type,
                    value: c.value ?? null,
                  }))}
                  initialSelectedId={myMember?.selectedCriterionId || null}
                  locked={myLocked}
                />
              )}
            </>
          )}

          <GameResultsInline groupId={group.id} currentUserId={user.id} />
        </section>
      </main>
    </div>
  );
}

