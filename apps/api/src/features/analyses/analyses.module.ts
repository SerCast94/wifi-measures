import { Module } from "@nestjs/common";

import { AnalysesService } from "./application/analyses.service";
import { AnalysesController } from "./presentation/http/analyses.controller";

@Module({
  imports: [],
  providers: [AnalysesService],
  controllers: [AnalysesController],
  exports: [AnalysesService],
})
export class AnalysesModule {}
