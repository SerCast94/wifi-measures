import { Module } from "@nestjs/common";

import { SurveysService } from "./application/surveys.service";
import { SurveysController } from "./presentation/http/surveys.controller";
import { MeasuresModule } from "@features/measures/measures.module";

@Module({
  imports: [MeasuresModule],
  providers: [SurveysService],
  controllers: [SurveysController],
  exports: [SurveysService],
})
export class SurveysModule {}
