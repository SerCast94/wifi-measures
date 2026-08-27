ALTER TABLE "audit_analyses" ADD COLUMN IF NOT EXISTS "floor_id" INTEGER;
ALTER TABLE "audit_analyses" DROP CONSTRAINT IF EXISTS "audit_analyses_floor_id_fkey";
ALTER TABLE "audit_analyses" ADD CONSTRAINT "audit_analyses_floor_id_fkey" FOREIGN KEY ("floor_id") REFERENCES "audit_floors"("id") ON DELETE SET NULL ON UPDATE CASCADE;
