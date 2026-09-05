-- CreateTable
CREATE TABLE "lora_audit_measures" (
    "audit_id" TEXT NOT NULL,
    "measure_id" INTEGER NOT NULL,

    CONSTRAINT "lora_audit_measures_pkey" PRIMARY KEY ("audit_id", "measure_id")
);

-- CreateTable
CREATE TABLE "lora_audit_noise" (
    "audit_id" TEXT NOT NULL,
    "noise_id" INTEGER NOT NULL,

    CONSTRAINT "lora_audit_noise_pkey" PRIMARY KEY ("audit_id", "noise_id")
);

-- Migrate existing 1:1 links into the new join tables
INSERT INTO "lora_audit_measures" ("audit_id", "measure_id")
SELECT "id", "measure_id" FROM "lora_audits" WHERE "measure_id" IS NOT NULL;

INSERT INTO "lora_audit_noise" ("audit_id", "noise_id")
SELECT "id", "noise_id" FROM "lora_audits" WHERE "noise_id" IS NOT NULL;

-- Drop old scalar FK columns
ALTER TABLE "lora_audits" DROP CONSTRAINT IF EXISTS "lora_audits_measure_id_fkey";
ALTER TABLE "lora_audits" DROP CONSTRAINT IF EXISTS "lora_audits_noise_id_fkey";
ALTER TABLE "lora_audits" DROP COLUMN IF EXISTS "measure_id";
ALTER TABLE "lora_audits" DROP COLUMN IF EXISTS "noise_id";

-- CreateIndex
CREATE INDEX "lora_audit_measures_measure_id_idx" ON "lora_audit_measures"("measure_id");

-- CreateIndex
CREATE INDEX "lora_audit_noise_noise_id_idx" ON "lora_audit_noise"("noise_id");

-- AddForeignKey
ALTER TABLE "lora_audit_measures" ADD CONSTRAINT "lora_audit_measures_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "lora_audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lora_audit_measures" ADD CONSTRAINT "lora_audit_measures_measure_id_fkey" FOREIGN KEY ("measure_id") REFERENCES "lora_measures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lora_audit_noise" ADD CONSTRAINT "lora_audit_noise_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "lora_audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lora_audit_noise" ADD CONSTRAINT "lora_audit_noise_noise_id_fkey" FOREIGN KEY ("noise_id") REFERENCES "lora_noise"("id") ON DELETE CASCADE ON UPDATE CASCADE;