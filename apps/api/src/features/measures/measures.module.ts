import { Module } from "@nestjs/common";

import {
  MEASURES_REPOSITORY_TOKEN,
  SUBMISSIONS_REPOSITORY_TOKEN,
} from "./domain/config/tokens";
import { DatabaseModule } from "@core/database/database.module";
import { MeasuresService } from "./application/measures.service";
import { AreaPlanService } from "./application/area-plan.service";
import { AreasController } from "./presentation/http/areas.controller";
import { MeasuresController } from "./presentation/http/measures.controller";
import { DatabaseMeasuresRepository } from "./infrastructure/repositories/database-measures.repository";
import { LinkLiveSubmissionsRepository } from "./infrastructure/repositories/linklive-submissions.repository";

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: MEASURES_REPOSITORY_TOKEN,
      useClass: DatabaseMeasuresRepository,
    },
    {
      provide: SUBMISSIONS_REPOSITORY_TOKEN,
      useClass: LinkLiveSubmissionsRepository,
    },
    MeasuresService,
    AreaPlanService,
  ],
  controllers: [MeasuresController, AreasController],
  exports: [AreaPlanService, MeasuresService],
})
export class MeasuresModule {}
