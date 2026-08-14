import { Module } from "@nestjs/common";

import {
  MEASURES_REPOSITORY_TOKEN,
  SUBMISSIONS_REPOSITORY_TOKEN,
} from "./domain/config/tokens";
import { OdkService } from "@core/odk/odk.service";
import { DatabaseModule } from "@core/database/database.module";
import { MeasuresService } from "./application/measures.service";
import { AreasController } from "./presentation/http/areas.controller";
import { MeasuresController } from "./presentation/http/measures.controller";
import { OdkSubmissionsRepository } from "./infrastructure/repositories/odk-submissions.repository";
import { SimpleMeasuresRepository } from "./infrastructure/repositories/simple-measures.repository";

@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: MEASURES_REPOSITORY_TOKEN,
      useClass: SimpleMeasuresRepository,
    },
    {
      provide: SUBMISSIONS_REPOSITORY_TOKEN,
      useClass: OdkSubmissionsRepository,
    },
    OdkService,
    MeasuresService,
  ],
  controllers: [MeasuresController, AreasController],
})
export class MeasuresModule {}
