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
      name: `iPhone Draw - ${today.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}`,
      maxMembers: 500,
      entryFee: 250,
      closesAt,
    },
  });

  console.log("Created seed group:", group.name);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
