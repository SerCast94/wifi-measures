const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const tables = await p.$queryRawUnsafe("SELECT tablename FROM pg_tables WHERE schemaname='public' AND tablename LIKE '%floor%'");
  console.log("floor tables:", JSON.stringify(tables));
  const audits = await p.$queryRawUnsafe("SELECT column_name FROM information_schema.columns WHERE table_name='audit_analyses' ORDER BY ordinal_position");
  console.log("audit_analyses columns:", JSON.stringify(audits));
  await p.$disconnect();
})();
