require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const r = await p.$queryRawUnsafe("SHOW CREATE TABLE users");
  console.log("Surowe dane:", JSON.stringify(r, null, 2));
  console.log("Klucze pierwszego wiersza:", Object.keys(r[0]));
  await p.$disconnect();
})().catch(e => console.error(e.message));
