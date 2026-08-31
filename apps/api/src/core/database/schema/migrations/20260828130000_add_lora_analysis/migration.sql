-- CreateTable: resultados del análisis de auditorías LoRa
CREATE TABLE "lora_analyses" (
    "id" TEXT NOT NULL,
    "audit_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "block_role" TEXT,
    "value" DOUBLE PRECISION,
    "unit" TEXT,
    "status" TEXT NOT NULL,
    "label" TEXT,
    "message" TEXT,
    "run_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lora_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lora_analyses_audit_id_idx" ON "lora_analyses"("audit_id");
CREATE INDEX "lora_analyses_audit_id_category_idx" ON "lora_analyses"("audit_id", "category");

-- AddForeignKey
ALTER TABLE "lora_analyses" ADD CONSTRAINT "lora_analyses_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "lora_audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
