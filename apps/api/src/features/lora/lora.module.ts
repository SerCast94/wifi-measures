import { Module } from "@nestjs/common";

import { LoraService } from "./application/lora.service";
import { LoraEvaluationService } from "./application/lora-evaluation.service";
import { LoraController } from "./presentation/http/lora.controller";
import { ExteriorHeatmapsModule } from "@features/exterior-heatmaps/exterior-heatmaps.module";

@Module({
  imports: [ExteriorHeatmapsModule],
  controllers: [LoraController],
  providers: [LoraService, LoraEvaluationService],
  exports: [LoraService, LoraEvaluationService],
})
export class LoraModule {}
