import { Controller, Get, HttpCode } from "@nestjs/common";

import { ApiExtraModels, ApiTags } from "@nestjs/swagger";

import { ApiResponseType } from "@core/swagger/decorators/response.decorator";
import { NetAllyService } from "@features/netally/application/netally.service";
import { NetAllyDashboardPresenter } from "./netally-dashboard.presenter";

@Controller("dashboard")
@ApiTags("Dashboard")
@ApiExtraModels(NetAllyDashboardPresenter)
export class DashboardController {
  constructor(private readonly netAllyService: NetAllyService) {}

  @Get("netally")
  @HttpCode(200)
  @ApiResponseType(NetAllyDashboardPresenter, false)
  async getNetAllyDashboard() {
    const data = await this.netAllyService.getNetAllyDashboard();

    return new NetAllyDashboardPresenter(data);
  }
}
