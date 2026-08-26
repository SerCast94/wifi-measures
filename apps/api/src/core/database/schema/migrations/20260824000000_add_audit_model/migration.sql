-- CreateTable
CREATE TABLE "audit_profiles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "auditType" TEXT NOT NULL DEFAULT 'GENERAL',
    "description" TEXT,
    "thresholds" JSONB NOT NULL,
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audits" (
    "id" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "client" TEXT,
    "project" TEXT,
    "location" TEXT,
    "address" TEXT,
    "building" TEXT,
    "technician" TEXT,
    "status" TEXT NOT NULL DEFAULT 'BORRADOR',
    "description" TEXT,
    "objective" TEXT,
    "scope" TEXT,
    "methodology" TEXT,
    "observations" TEXT,
    "auditDate" TIMESTAMP(3),
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),
    "profile_id" TEXT,
    "area_keys" TEXT[] NOT NULL,
    "ssid_filter" TEXT,
    "last_sync_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_floors" (
    "id" SERIAL NOT NULL,
    "audit_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "audit_floors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_measures" (
    "audit_id" TEXT NOT NULL,
    "measure_id" TEXT NOT NULL,
    "floor_id" INTEGER,
    "label" TEXT,

    CONSTRAINT "audit_measures_pkey" PRIMARY KEY ("audit_id","measure_id")
);

-- CreateTable
CREATE TABLE "audit_surveys" (
    "audit_id" TEXT NOT NULL,
    "survey_id" INTEGER NOT NULL,
    "floor_id" INTEGER,

    CONSTRAINT "audit_surveys_pkey" PRIMARY KEY ("audit_id","survey_id")
);

-- CreateTable
CREATE TABLE "audit_analyses" (
    "audit_id" TEXT NOT NULL,
    "analysis_id" INTEGER NOT NULL,

    CONSTRAINT "audit_analyses_pkey" PRIMARY KEY ("audit_id","analysis_id")
);

-- CreateTable
CREATE TABLE "audit_tests" (
    "id" TEXT NOT NULL,
    "audit_id" TEXT NOT NULL,
    "section" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT true,
    "status" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "result_status" TEXT,
    "source_type" TEXT,
    "source_ids" JSONB,
    "notes" TEXT,
    "completed_at" TIMESTAMP(3),
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_evaluations" (
    "id" TEXT NOT NULL,
    "audit_id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "metric" TEXT NOT NULL,
    "value" DOUBLE PRECISION,
    "unit" TEXT,
    "status" TEXT NOT NULL,
    "threshold" JSONB,
    "message" TEXT,
    "source_type" TEXT,
    "source_id" TEXT,
    "source_guid" TEXT,
    "floor_id" INTEGER,
    "location_label" TEXT,
    "batch_id" TEXT,
    "run_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_evaluations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_issues" (
    "id" TEXT NOT NULL,
    "audit_id" TEXT NOT NULL,
    "origin" TEXT NOT NULL DEFAULT 'MANUAL',
    "state" TEXT NOT NULL DEFAULT 'SUGERIDA',
    "type" TEXT,
    "severity" TEXT NOT NULL DEFAULT 'MEDIUM',
    "title" TEXT NOT NULL,
    "description" TEXT,
    "location_label" TEXT,
    "floor_id" INTEGER,
    "metric" TEXT,
    "value" DOUBLE PRECISION,
    "unit" TEXT,
    "threshold" JSONB,
    "evidence" JSONB,
    "photo" TEXT,
    "recommendation_text" TEXT,
    "detected_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_issues_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_recommendations" (
    "id" TEXT NOT NULL,
    "audit_id" TEXT NOT NULL,
    "issue_id" TEXT,
    "origin" TEXT NOT NULL DEFAULT 'AUTO',
    "category" TEXT NOT NULL DEFAULT 'INMEDIATA',
    "text" TEXT NOT NULL,
    "basis" JSONB,
    "accepted" BOOLEAN,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_recommendations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_conclusions" (
    "id" TEXT NOT NULL,
    "audit_id" TEXT NOT NULL,
    "draft" TEXT,
    "final_text" TEXT,
    "global_result" TEXT,
    "generated_at" TIMESTAMP(3),
    "edited_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audit_conclusions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_reports" (
    "id" TEXT NOT NULL,
    "audit_id" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "config" JSONB,
    "generated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_sync_logs" (
    "id" TEXT NOT NULL,
    "audit_id" TEXT NOT NULL,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),
    "ok" BOOLEAN,
    "created_measures" INTEGER NOT NULL DEFAULT 0,
    "updated_measures" INTEGER NOT NULL DEFAULT 0,
    "created_surveys" INTEGER NOT NULL DEFAULT 0,
    "created_analyses" INTEGER NOT NULL DEFAULT 0,
    "duplicates" INTEGER NOT NULL DEFAULT 0,
    "errors" JSONB,

    CONSTRAINT "audit_sync_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "audit_profiles_name_key" ON "audit_profiles"("name");

-- CreateIndex
CREATE INDEX "audits_status_idx" ON "audits"("status");

-- CreateIndex
CREATE INDEX "audit_floors_audit_id_idx" ON "audit_floors"("audit_id");

-- CreateIndex
CREATE INDEX "audit_measures_measure_id_idx" ON "audit_measures"("measure_id");

-- CreateIndex
CREATE INDEX "audit_surveys_survey_id_idx" ON "audit_surveys"("survey_id");

-- CreateIndex
CREATE INDEX "audit_analyses_analysis_id_idx" ON "audit_analyses"("analysis_id");

-- CreateIndex
CREATE UNIQUE INDEX "audit_tests_audit_id_key_key" ON "audit_tests"("audit_id", "key");

-- CreateIndex
CREATE INDEX "audit_tests_audit_id_idx" ON "audit_tests"("audit_id");

-- CreateIndex
CREATE INDEX "audit_evaluations_audit_id_idx" ON "audit_evaluations"("audit_id");

-- CreateIndex
CREATE INDEX "audit_evaluations_audit_id_category_idx" ON "audit_evaluations"("audit_id", "category");

-- CreateIndex
CREATE INDEX "audit_issues_audit_id_idx" ON "audit_issues"("audit_id");

-- CreateIndex
CREATE INDEX "audit_recommendations_audit_id_idx" ON "audit_recommendations"("audit_id");

-- CreateIndex
CREATE UNIQUE INDEX "audit_conclusions_audit_id_key" ON "audit_conclusions"("audit_id");

-- CreateIndex
CREATE INDEX "audit_reports_audit_id_idx" ON "audit_reports"("audit_id");

-- CreateIndex
CREATE INDEX "audit_sync_logs_audit_id_idx" ON "audit_sync_logs"("audit_id");

-- AddForeignKey
ALTER TABLE "audits" ADD CONSTRAINT "audits_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "audit_profiles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_floors" ADD CONSTRAINT "audit_floors_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_measures" ADD CONSTRAINT "audit_measures_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_measures" ADD CONSTRAINT "audit_measures_measure_id_fkey" FOREIGN KEY ("measure_id") REFERENCES "medidas"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_measures" ADD CONSTRAINT "audit_measures_floor_id_fkey" FOREIGN KEY ("floor_id") REFERENCES "audit_floors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_surveys" ADD CONSTRAINT "audit_surveys_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_surveys" ADD CONSTRAINT "audit_surveys_survey_id_fkey" FOREIGN KEY ("survey_id") REFERENCES "linklive_surveys"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_surveys" ADD CONSTRAINT "audit_surveys_floor_id_fkey" FOREIGN KEY ("floor_id") REFERENCES "audit_floors"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_analyses" ADD CONSTRAINT "audit_analyses_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_analyses" ADD CONSTRAINT "audit_analyses_analysis_id_fkey" FOREIGN KEY ("analysis_id") REFERENCES "linklive_analyses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_tests" ADD CONSTRAINT "audit_tests_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_evaluations" ADD CONSTRAINT "audit_evaluations_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_issues" ADD CONSTRAINT "audit_issues_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_recommendations" ADD CONSTRAINT "audit_recommendations_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_recommendations" ADD CONSTRAINT "audit_recommendations_issue_id_fkey" FOREIGN KEY ("issue_id") REFERENCES "audit_issues"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_conclusions" ADD CONSTRAINT "audit_conclusions_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_reports" ADD CONSTRAINT "audit_reports_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_sync_logs" ADD CONSTRAINT "audit_sync_logs_audit_id_fkey" FOREIGN KEY ("audit_id") REFERENCES "audits"("id") ON DELETE CASCADE ON UPDATE CASCADE;
