import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  await prisma.transaction.createMany({
    data: [
      {
        merchant: "Amazon",
        amount: 54.23,
        category: "Shopping",
      },
      {
        merchant: "Starbucks",
        amount: 6.75,
        category: "Food",
      },
    ],
  });
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });