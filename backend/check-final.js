require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  console.log("=== Rozkad statusów ===");
  const s = await p.$queryRawUnsafe(`SELECT status, COUNT(*) as cnt FROM users GROUP BY status ORDER BY cnt DESC`);
  s.forEach(r => console.log(`  ${r.status}: ${r.cnt}`));

  console.log("\n=== Rozkad is_active ===");
  const a = await p.$queryRawUnsafe(`SELECT is_active, COUNT(*) as cnt FROM users GROUP BY is_active`);
  a.forEach(r => console.log(`  is_active=${r.is_active}: ${r.cnt}`));

  console.log("\n=== Skadki za biecy miesic ===");
  const c = await p.$queryRawUnsafe(`
    SELECT status, COUNT(*) as cnt, SUM(amount) as total 
    FROM contributions 
    WHERE month = MONTH(CURRENT_DATE()) AND year = YEAR(CURRENT_DATE())
    GROUP BY status
  `);
  c.forEach(r => console.log(`  ${r.status}: ${r.cnt} (${r.total} z)`));

  await p.$disconnect();
})().catch(e => console.error(e.message));
