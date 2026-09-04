-- CreateTable
CREATE TABLE "audit_floor_plans" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileType" TEXT NOT NULL DEFAULT 'image',
    "size" INTEGER NOT NULL DEFAULT 0,
    "floorZone" TEXT,
    "image" TEXT,
    "originalFile" TEXT,
    "width" INTEGER NOT NULL DEFAULT 0,
    "height" INTEGER NOT NULL DEFAULT 0,
    "scale" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_floor_plans_pkey" PRIMARY KEY ("id")
);
