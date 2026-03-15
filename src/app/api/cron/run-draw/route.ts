import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GroupStatus, TransactionType } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * Run criteria-based draw for CLOSED groups.
 * Call after close-groups cron (e.g. every minute).
 * - Only members with CONFIRMED payment and a locked guess (guessLockedAt) participate.
 * - If group has criteria: winning criterion is the one with majority match; winners share prize pool.
 * - If no criteria: legacy single random winner (group.winnerId).
 * - Prize pool: 90% of total entry fees (platform fee 10%).
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const closed = await prisma.group.findMany({
      where: { status: GroupStatus.CLOSED },
      include: {
        criteria: { orderBy: { order: "asc" } },
        members: {
          where: { paymentStatus: "CONFIRMED" },
          include: {
            user: { select: { state: true } },
          },
        },
      },
    });

    let run = 0;
    for (const group of closed) {
      const confirmed = group.members;
      // Only consider members who actually locked their guess
      const participants = confirmed.filter((m) => m.guessLockedAt != null);
      const n = participants.length;
      if (n === 0) {
        // No locked participants: just mark draw done with no winners.
        await prisma.group.update({
          where: { id: group.id },
          data: {
            status: GroupStatus.DRAW_DONE,
            drawDoneAt: new Date(),
            winnerId: null,
          },
        });
        run++;
        continue;
      }

      const winningCriterionIds: string[] = [];

      if (group.criteria.length > 0) {
        // Evaluate each criterion and see which one has majority.
        for (const c of group.criteria) {
          let count = 0;
          if (c.type === "age_above" && c.value != null) {
            count = participants.filter(
              (m) => m.age != null && m.age > c.value!
            ).length;
          } else if (c.type === "age_below" && c.value != null) {
            count = participants.filter(
              (m) => m.age != null && m.age < c.value!
            ).length;
          } else if (c.type === "majority_male") {
            count = participants.filter((m) => m.gender === "MALE").length;
          } else if (c.type === "majority_female") {
            count = participants.filter((m) => m.gender === "FEMALE").length;
          } else if (c.type === "majority_state" && c.valueStr) {
            count = participants.filter(
              (m) => m.user?.state != null && m.user.state === c.valueStr
            ).length;
          }

          if (count > n / 2) {
            winningCriterionIds.push(c.id);
          }
        }
      }

      let winnerId: string | null = null;

      if (group.criteria.length > 0 && winningCriterionIds.length > 0) {
        // Members whose locked guess matches winning criterion win.
        const winners = participants.filter((m) =>
          winningCriterionIds.includes(m.selectedCriterionId || "")
        );

        if (winners.length > 0) {
          await prisma.$transaction(async (tx) => {
            await tx.member.updateMany({
              where: {
                id: { in: winners.map((w) => w.id) },
              },
              data: { isWinner: true },
            });

            // Compute prize pool: 90% of total entry fees for this group.
            const totalPool = group.entryFee * group.maxMembers;
            const platformFee = Math.floor(totalPool * 0.1);
            const prizePool = totalPool - platformFee;
            const perWinner = Math.floor(prizePool / winners.length);

            if (perWinner > 0) {
              // Credit wallets for real users (skip bots or missing userId)
              for (const w of winners) {
                if (!w.userId || w.isBot) continue;
                await tx.user.update({
                  where: { id: w.userId },
                  data: {
                    walletBalance: { increment: perWinner },
                    transactions: {
                      create: {
                        type: TransactionType.WIN_PAYOUT,
                        amount: perWinner,
                        meta: {
                          groupId: group.id,
                          memberId: w.id,
                          prizePool,
                          platformFee,
                        },
                      },
                    },
                  },
                });
              }
            }
          });

          const firstWinner = winners[0];
          if (firstWinner) {
            winnerId = firstWinner.id;
          }
        }
      } else if (group.criteria.length === 0 && participants.length > 0) {
        // Legacy: random single winner among participants.
        const winner = participants[Math.floor(Math.random() * n)]!;
        await prisma.member.update({
          where: { id: winner.id },
          data: { isWinner: true },
        });
        if (winner.userId && !winner.isBot) {
          const totalPool = group.entryFee * group.maxMembers;
          const platformFee = Math.floor(totalPool * 0.1);
          const prizePool = totalPool - platformFee;
          await prisma.user.update({
            where: { id: winner.userId },
            data: {
              walletBalance: { increment: prizePool },
              transactions: {
                create: {
                  type: TransactionType.WIN_PAYOUT,
                  amount: prizePool,
                  meta: {
                    groupId: group.id,
                    memberId: winner.id,
                    prizePool,
                    platformFee,
                  },
                },
              },
            },
          });
        }
        winnerId = winner.id;
      }

      await prisma.group.update({
        where: { id: group.id },
        data: {
          status: GroupStatus.DRAW_DONE,
          drawDoneAt: new Date(),
          winnerId,
        },
      });
      run++;
    }

    return NextResponse.json({ success: true, drawRun: run });
  } catch (error) {
    console.error("Cron run-draw:", error);
    return NextResponse.json(
      { error: "Failed to run draw" },
      { status: 500 }
    );
  }
}
