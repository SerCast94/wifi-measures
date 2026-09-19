-- LoraMeasure -> muestras de medidas reales (una fila CSV = una muestra).

-- CreateTable
CREATE TABLE "lora_measure_samples" (
    "id" SERIAL NOT NULL,
    "measure_id" INTEGER NOT NULL,
    "tx_cnt" INTEGER,
    "time" TEXT,
    "rssi" DOUBLE PRECISION,
    "rssis" DOUBLE PRECISION,
    "snr" DOUBLE PRECISION,
    "signal" TEXT,
    "uplink_packet" INTEGER,
    "confirm_packet" INTEGER,
    "packet_loss_pct" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "latitude" DOUBLE PRECISION,
    "location" TEXT,
    "sf" TEXT,
    "tx_power" TEXT,

    CONSTRAINT "lora_measure_samples_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lora_measure_samples_measure_id_idx" ON "lora_measure_samples"("measure_id");

-- AddForeignKey
ALTER TABLE "lora_measure_samples" ADD CONSTRAINT "lora_measure_samples_measure_id_fkey" FOREIGN KEY ("measure_id") REFERENCES "lora_measures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable: LoraMeasure -> origen del archivo y nuevo modelo de muestras
ALTER TABLE "lora_measures"
    ADD COLUMN "source" TEXT;

-- Los bloques Master/Slave (ping-pong) se sustituyen por muestras. Se eliminan
-- los registros existentes (sus enlaces a auditorías se borran en cascada) y
-- las columnas JSON de bloques dejan de usarse.
DELETE FROM "lora_analyses";

DELETE FROM "lora_measures";

ALTER TABLE "lora_measures"
    DROP COLUMN IF EXISTS "blocks";