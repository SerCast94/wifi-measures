-- AlterTable
ALTER TABLE "area_plans" ADD COLUMN "heatmap" JSONB;

-- CreateTable
CREATE TABLE "linklive_surveys" (
    "id" SERIAL NOT NULL,
    "idLinkLive" TEXT NOT NULL,
    "name" TEXT,
    "surveyName" TEXT,
    "surveyDescription" TEXT,
    "surveyMode" TEXT,
    "surveyPointCount" INTEGER NOT NULL DEFAULT 0,
    "surveyBluetooth" BOOLEAN NOT NULL DEFAULT false,
    "surveyActive1x1" BOOLEAN NOT NULL DEFAULT false,
    "ssid1x1" TEXT,
    "unitId" TEXT,
    "unitName" TEXT,
    "unitMac" TEXT,
    "unitSerial" TEXT,
    "unitType" TEXT,
    "unitHardware" TEXT,
    "status" TEXT,
    "fileType" TEXT,
    "floorPlanFilename" TEXT,
    "floorPlanWidth" INTEGER NOT NULL DEFAULT 0,
    "floorPlanHeight" INTEGER NOT NULL DEFAULT 0,
    "floorPlanScalePpf" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "floorPlanScaledWidth" INTEGER NOT NULL DEFAULT 0,
    "floorPlanScaledHeight" INTEGER NOT NULL DEFAULT 0,
    "analysisGuid" TEXT,
    "surveyStartTime" TIMESTAMP(3),
    "image" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "linklive_surveys_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "linklive_survey_points" (
    "id" SERIAL NOT NULL,
    "surveyId" INTEGER NOT NULL,
    "metric" TEXT NOT NULL,
    "pointIdx" INTEGER NOT NULL DEFAULT 0,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "value" DOUBLE PRECISION,
    "time" TEXT,

    CONSTRAINT "linklive_survey_points_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "linklive_surveys_idLinkLive_key" ON "linklive_surveys"("idLinkLive");

-- CreateIndex
CREATE INDEX "linklive_survey_points_surveyId_idx" ON "linklive_survey_points"("surveyId");

-- AddForeignKey
ALTER TABLE "linklive_survey_points" ADD CONSTRAINT "linklive_survey_points_surveyId_fkey" FOREIGN KEY ("surveyId") REFERENCES "linklive_surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;