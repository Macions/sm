require("dotenv").config();
console.log("DATABASE_URL z .env:", process.env.DATABASE_URL);

const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const r = await p.$queryRawUnsafe("SELECT USER() as user, DATABASE() as db");
  console.log("Prisma czy si jako:", r);
  await p.$disconnect();
})().catch(e => console.error(e.message));
