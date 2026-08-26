import { Module } from "@nestjs/common";

import { MeasuresModule } from "@features/measures/measures.module";
import { SurveysModule } from "@features/surveys/surveys.module";
import { AnalysesModule } from "@features/analyses/analyses.module";
import { AuditsService } from "./application/audits.service";
import { AuditEvaluationService } from "./application/audit-evaluation.service";
import { AuditIssueService } from "./application/audit-issue.service";
import { AuditRecommendationService } from "./application/audit-recommendation.service";
import { AuditSyncService } from "./application/audit-sync.service";
import { AuditDataQualityService } from "./application/audit-data-quality.service";
import { AuditReportService } from "./application/audit-report.service";
import { AuditsController } from "./presentation/http/audits.controller";

@Module({
  imports: [MeasuresModule, SurveysModule, AnalysesModule],
  controllers: [AuditsController],
  providers: [
    AuditsService,
    AuditEvaluationService,
    AuditIssueService,
    AuditRecommendationService,
    AuditSyncService,
    AuditDataQualityService,
    AuditReportService,
  ],
  exports: [AuditsService],
})
export class AuditsModule {}
