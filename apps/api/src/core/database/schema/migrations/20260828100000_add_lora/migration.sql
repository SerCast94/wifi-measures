-- CreateTable
CREATE TABLE "lora_measures" (
    "id" SERIAL NOT NULL,
    "signal_strength" DOUBLE PRECISION,
    "snr" DOUBLE PRECISION,
    "uplink_packet" INTEGER,
    "confirm_packet" INTEGER,
    "packet_loss_pct" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "location_name" TEXT,
    "spreading_factor" INTEGER,
    "tx_power" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lora_measures_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lora_noise" (
    "id" SERIAL NOT NULL,
    "frequency" DOUBLE PRECISION,
    "current_scan" DOUBLE PRECISION,
    "weighted_average_scan" DOUBLE PRECISION,
    "location" TEXT,
    "longitude" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lora_noise_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "lora_audits" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "client" TEXT,
    "project" TEXT,
    "location" TEXT,
    "technician" TEXT,
    "description" TEXT,
    "objective" TEXT,
    "status" TEXT NOT NULL DEFAULT 'BORRADOR',
    "audit_date" TIMESTAMP(3),
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "measure_id" INTEGER,
    "noise_id" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lora_audits_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lora_audits_status_idx" ON "lora_audits"("status");

-- AddForeignKey
ALTER TABLE "lora_audits" ADD CONSTRAINT "lora_audits_measure_id_fkey" FOREIGN KEY ("measure_id") REFERENCES "lora_measures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lora_audits" ADD CONSTRAINT "lora_audits_noise_id_fkey" FOREIGN KEY ("noise_id") REFERENCES "lora_noise"("id") ON DELETE SET NULL ON UPDATE CASCADE;
