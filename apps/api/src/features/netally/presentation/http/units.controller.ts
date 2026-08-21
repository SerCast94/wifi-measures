import { Controller, Get, HttpCode } from "@nestjs/common";

import { ApiExtraModels, ApiTags } from "@nestjs/swagger";

import { ApiResponseType } from "@core/swagger/decorators/response.decorator";
import { NetAllyService } from "@features/netally/application/netally.service";
import { UnitPresenter } from "./unit.presenter";

@Controller("units")
@ApiTags("Units")
@ApiExtraModels(UnitPresenter)
export class UnitsController {
  constructor(private readonly netAllyService: NetAllyService) {}

  @Get("")
  @HttpCode(200)
  @ApiResponseType(UnitPresenter, true)
  async getUnits() {
    const units = await this.netAllyService.getUnits();

    return units.map((unit) => new UnitPresenter(unit));
  }
}
