const { PrismaClient } = require("@prisma/client");
const p = new PrismaClient();
(async () => {
  const first = await p.auditAnalysis.findFirst();
  if (!first) { console.log("no rows"); await p.$disconnect(); return; }
  const floors = await p.auditFloor.findMany({ where: { auditId: first.auditId } });
  console.log("floors for audit:", floors.map(f => f.id + ":" + f.name));
  if (floors.length > 0) {
    const r = await p.auditAnalysis.update({
      where: { auditId_analysisId: { auditId: first.auditId, analysisId: first.analysisId } },
      data: { floorId: floors[0].id },
    });
    console.log("update OK floorId:", r.floorId);
    await p.auditAnalysis.update({
      where: { auditId_analysisId: { auditId: first.auditId, analysisId: first.analysisId } },
      data: { floorId: null },
    });
    console.log("revert OK");
  }
  await p.$disconnect();
})();
