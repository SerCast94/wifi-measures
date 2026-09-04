import { Module } from "@nestjs/common";

import { NetAllyService } from "./application/netally.service";
import { DashboardController } from "./presentation/http/dashboard.controller";
import { FloorPlansController } from "./presentation/http/floorplans.controller";
import { UnitsController } from "./presentation/http/units.controller";

@Module({
  providers: [NetAllyService],
  controllers: [UnitsController, DashboardController, FloorPlansController],
})
export class NetAllyModule {}
