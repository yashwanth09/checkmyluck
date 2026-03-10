import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const closesAt = new Date(today);
  closesAt.setHours(19, 0, 0, 0);
  if (closesAt <= new Date()) {
    closesAt.setDate(closesAt.getDate() + 1);
  }

  const group = await prisma.group.create({
    data: {
      name: `Draw - ${today.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}`,
      maxMembers: 20,
      entryFee: 20,
      closesAt,
      durationMinutes: 5,
      criteria: {
        create: [
          {
            label: "Mostly women",
            type: "majority_female",
            order: 0,
          },
          {
            label: "Mostly men",
            type: "majority_male",
            order: 1,
          },
          {
            label: "Mostly under 35",
            type: "age_below",
            value: 35,
            order: 2,
          },
          {
            label: "Mostly 35 or older",
            type: "age_above",
            value: 35,
            order: 3,
          },
        ],
      },
    },
  });

  console.log("Created seed group with criteria:", group.name);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
