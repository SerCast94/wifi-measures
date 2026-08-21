-- CreateTable
CREATE TABLE "medidas" (
    "id" TEXT NOT NULL,
    "idLinkLive" TEXT NOT NULL,
    "name" TEXT,
    "fechaHora" TIMESTAMP(3),
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,
    "areaGeogr" TEXT,
    "provincia" TEXT,
    "emisiones" TEXT,
    "ptoMedida" TEXT,
    "nMedida" INTEGER NOT NULL DEFAULT 0,
    "azimut" INTEGER NOT NULL DEFAULT 0,
    "resultType" TEXT,
    "unitName" TEXT,
    "unitMac" TEXT,
    "unitType" TEXT,
    "profileName" TEXT,
    "overallColor" TEXT,
    "labels" TEXT[],
    "raw" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "medidas_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "medidas_idLinkLive_key" ON "medidas"("idLinkLive");
