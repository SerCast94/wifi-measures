import { Module } from "@nestjs/common";

import { FloorPlanService } from "./application/floorplan.service";
import { FloorPlansController } from "./presentation/http/floorplans.controller";
import { DatabaseModule } from "@core/database/database.module";

@Module({
  imports: [DatabaseModule],
  providers: [FloorPlanService],
  controllers: [FloorPlansController],
  exports: [FloorPlanService],
})
export class FloorPlansModule {}
