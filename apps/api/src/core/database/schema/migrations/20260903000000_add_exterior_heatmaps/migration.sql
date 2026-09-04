-- AlterTable: añadir georreferenciación al plano
ALTER TABLE "audit_floor_plans" ADD COLUMN "geo_calibration" JSONB;

-- CreateTable: mapa de calor exterior
CREATE TABLE "exterior_heatmaps" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'WIFI',
    "audit_id" TEXT,
    "lora_audit_id" TEXT,
    "points" JSONB NOT NULL DEFAULT '[]',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exterior_heatmaps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exterior_heatmaps_audit_id_idx" ON "exterior_heatmaps"("audit_id");

-- CreateIndex
CREATE INDEX "exterior_heatmaps_lora_audit_id_idx" ON "exterior_heatmaps"("lora_audit_id");

-- AddForeignKey: Wi-Fi
ALTER TABLE "exterior_heatmaps"
    ADD CONSTRAINT "exterior_heatmaps_audit_id_fkey"
    FOREIGN KEY ("audit_id") REFERENCES "audits"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: LoRa
ALTER TABLE "exterior_heatmaps"
    ADD CONSTRAINT "exterior_heatmaps_lora_audit_id_fkey"
    FOREIGN KEY ("lora_audit_id") REFERENCES "lora_audits"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
