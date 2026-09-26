require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  console.log("DATABASE_URL:", process.env.DATABASE_URL);
  const t = await p.$queryRawUnsafe("SHOW TABLES");
  console.log("Wszystkie tabele w bazie:");
  t.forEach(r => console.log("  -", Object.values(r)[0]));
  await p.$disconnect();
})().catch(e => console.error(e.message));
