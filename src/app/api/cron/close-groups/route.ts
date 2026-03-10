import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { GroupStatus } from "@prisma/client";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

// Call this via cron at 7:01 PM daily. Closes due groups:
// - Full (memberCount >= maxMembers) → CLOSED (eligible for draw)
// - Not full → CANCELLED (refund everyone; no draw)
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && auth !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const due = await prisma.group.findMany({
      where: {
        status: { in: [GroupStatus.OPEN, GroupStatus.FULL] },
        closesAt: { lte: now },
      },
      include: {
        _count: { select: { members: true } },
        criteria: { select: { id: true } },
      },
    });

    let closed = 0;
    let cancelled = 0;
    let botsAdded = 0;
    const genders = ["MALE", "FEMALE"] as const;
    const botNames = [
      "Rahul",
      "Priya",
      "Amit",
      "Neha",
      "Vikram",
      "Anjali",
      "Rohan",
      "Sonal",
      "Karan",
      "Pooja",
    ];

    for (const g of due) {
      const currentMembers = g._count.members;

      if (currentMembers === 0) {
        await prisma.group.update({
          where: { id: g.id },
          data: { status: GroupStatus.CANCELLED },
        });
        cancelled++;
        continue;
      }

      // Fill remaining slots with bots so the game always has maxMembers players.
      const slotsLeft = g.maxMembers - currentMembers;
      if (slotsLeft > 0) {
        const criteriaIds = g.criteria.map((c) => c.id);
        let displayIndex = currentMembers + 1;
        for (let i = 0; i < slotsLeft; i++) {
          const unique = `bot-${randomBytes(4).toString("hex")}-${Date.now()}-${i}`;
          const botCriterionId =
            criteriaIds.length > 0
              ? criteriaIds[Math.floor(Math.random() * criteriaIds.length)]
              : null;
          const displayName = botNames[(displayIndex - 1) % botNames.length];
          await prisma.member.create({
            data: {
              groupId: g.id,
              mobileNumber: unique,
              displayName,
              address: "Virtual participant",
              bidCount: 1,
              totalAmount: g.entryFee,
              paymentStatus: "CONFIRMED",
              isBot: true,
              age: 25 + Math.floor(Math.random() * 31),
              gender: genders[Math.floor(Math.random() * 2)],
              selectedCriterionId: botCriterionId ?? undefined,
            },
          });
          displayIndex++;
          botsAdded++;
        }
      }

      await prisma.group.update({
        where: { id: g.id },
        data: { status: GroupStatus.CLOSED },
      });
      closed++;
    }

    return NextResponse.json({
      success: true,
      closed,
      cancelled,
      botsAdded,
    });
  } catch (error) {
    console.error("Cron close-groups:", error);
    return NextResponse.json(
      { error: "Failed to close groups" },
      { status: 500 }
    );
  }
}
