-- CreateTable
CREATE TABLE "linklive_analyses" (
    "id" SERIAL NOT NULL,
    "idLinkLive" TEXT NOT NULL,
    "guid" TEXT,
    "analysisGuid" TEXT,
    "analysisType" TEXT,
    "name" TEXT,
    "status" TEXT,
    "startTime" TIMESTAMP(3),
    "endTime" TIMESTAMP(3),
    "fileName" TEXT,
    "unitId" TEXT,
    "unitName" TEXT,
    "unitType" TEXT,
    "unitHardware" TEXT,
    "apsCount" INTEGER NOT NULL DEFAULT 0,
    "bssidsCount" INTEGER NOT NULL DEFAULT 0,
    "ssidsCount" INTEGER NOT NULL DEFAULT 0,
    "clientsCount" INTEGER NOT NULL DEFAULT 0,
    "channelsCount" INTEGER NOT NULL DEFAULT 0,
    "probingClientsCount" INTEGER NOT NULL DEFAULT 0,
    "bluetoothCount" INTEGER NOT NULL DEFAULT 0,
    "href" TEXT,
    "raw" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "linklive_analyses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linklive_analysis_hosts" (
    "id" SERIAL NOT NULL,
    "analysisId" INTEGER NOT NULL,
    "hostType" TEXT NOT NULL,
    "hostKey" TEXT NOT NULL,
    "name" TEXT,
    "mac" TEXT,
    "channel" TEXT,
    "band" TEXT,
    "signal" DOUBLE PRECISION,
    "snr" DOUBLE PRECISION,
    "ssid" TEXT,
    "securityType" TEXT,
    "protocol" TEXT,
    "inactive" BOOLEAN NOT NULL DEFAULT false,
    "lastSeen" TIMESTAMP(3),
    "counts" JSONB,
    "wifiItem" JSONB,
    "raw" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "linklive_analysis_hosts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "linklive_analyses_idLinkLive_key" ON "linklive_analyses"("idLinkLive");

-- CreateIndex
CREATE INDEX "linklive_analysis_hosts_analysisId_idx" ON "linklive_analysis_hosts"("analysisId");

-- CreateIndex
CREATE UNIQUE INDEX "linklive_analysis_hosts_analysisId_hostType_hostKey_key" ON "linklive_analysis_hosts"("analysisId", "hostType", "hostKey");

-- AddForeignKey
ALTER TABLE "linklive_analysis_hosts" ADD CONSTRAINT "linklive_analysis_hosts_analysisId_fkey" FOREIGN KEY ("analysisId") REFERENCES "linklive_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;