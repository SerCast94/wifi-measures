-- AlterTable: LoraMeasure -> bloques anidados (Master/Slave)
ALTER TABLE "lora_measures"
    DROP COLUMN IF EXISTS "signal_strength",
    DROP COLUMN IF EXISTS "snr",
    DROP COLUMN IF EXISTS "uplink_packet",
    DROP COLUMN IF EXISTS "confirm_packet",
    DROP COLUMN IF EXISTS "packet_loss_pct",
    DROP COLUMN IF EXISTS "longitude",
    DROP COLUMN IF EXISTS "latitude",
    DROP COLUMN IF EXISTS "location_name",
    DROP COLUMN IF EXISTS "spreading_factor",
    DROP COLUMN IF EXISTS "tx_power";

ALTER TABLE "lora_measures"
    ADD COLUMN "location" TEXT,
    ADD COLUMN "time" TEXT,
    ADD COLUMN "spreading_factor" TEXT,
    ADD COLUMN "tx_power" TEXT,
    ADD COLUMN "blocks" JSON NOT NULL DEFAULT '[]'::json;

-- AlterTable: LoraNoise -> entradas por frecuencia anidadas
ALTER TABLE "lora_noise"
    DROP COLUMN IF EXISTS "frequency",
    DROP COLUMN IF EXISTS "current_scan",
    DROP COLUMN IF EXISTS "weighted_average_scan";

ALTER TABLE "lora_noise"
    ADD COLUMN "entries" JSON NOT NULL DEFAULT '[]'::json;
