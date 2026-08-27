const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  try {
    await p.$executeRawUnsafe('ALTER TABLE "audit_analyses" ADD COLUMN IF NOT EXISTS "floor_id" INTEGER');
    await p.$executeRawUnsafe('ALTER TABLE "audit_analyses" DROP CONSTRAINT IF EXISTS "audit_analyses_floor_id_fkey"');
    await p.$executeRawUnsafe(
      'ALTER TABLE "audit_analyses" ADD CONSTRAINT "audit_analyses_floor_id_fkey" FOREIGN KEY ("floor_id") REFERENCES "audit_floor_plans"("id") ON DELETE SET NULL ON UPDATE CASCADE'
    );
    console.log("migration OK");
    const first = await p.auditAnalysis.findFirst();
    if (first) {
      const r = await p.auditAnalysis.update({
        where: { auditId_analysisId: { auditId: first.auditId, analysisId: first.analysisId } },
        data: { floorId: 1 },
      });
      console.log("update OK floorId:", r.floorId);
      await p.auditAnalysis.update({
        where: { auditId_analysisId: { auditId: first.auditId, analysisId: first.analysisId } },
        data: { floorId: null },
      });
      console.log("revert OK");
    }
  } catch (e) {
    console.error("ERROR:", e.message.slice(0, 300));
  }
  await p.$disconnect();
})();
