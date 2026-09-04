import { Module } from "@nestjs/common";

import { ExteriorHeatmapService } from "./application/exterior-heatmap.service";
import { ExteriorHeatmapsController } from "./presentation/http/exterior-heatmaps.controller";
import { DatabaseModule } from "@core/database/database.module";

@Module({
  imports: [DatabaseModule],
  providers: [ExteriorHeatmapService],
  controllers: [ExteriorHeatmapsController],
  exports: [ExteriorHeatmapService],
})
export class ExteriorHeatmapsModule {}
