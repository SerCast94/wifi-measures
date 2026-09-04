-- AlterTable
ALTER TABLE "lora_audits" ADD COLUMN "floor_plan_id" INTEGER;

-- AddForeignKey
ALTER TABLE "lora_audits" ADD CONSTRAINT "lora_audits_floor_plan_id_fkey"
  FOREIGN KEY ("floor_plan_id") REFERENCES "audit_floor_plans"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
