-- AlterTable
ALTER TABLE "linklive_analyses" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "linklive_analysis_hosts" ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "linklive_analysis_hosts" ALTER COLUMN "created_at" SET DEFAULT CURRENT_TIMESTAMP;