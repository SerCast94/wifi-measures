import { Controller, Delete, Get, HttpCode, Param } from "@nestjs/common";

import { ApiExtraModels, ApiTags } from "@nestjs/swagger";

import { ApiResponseType } from "@core/swagger/decorators/response.decorator";
import { NetAllyService } from "@features/netally/application/netally.service";
import { UnitPresenter } from "./unit.presenter";
import { HasPermissions } from "@features/auth/presentation/http/decorators/permissions.decorator";
import { MANAGE_MEASURES } from "@core/database/seeders/permissions/manage-measures.permissions";

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

  @Delete("files/:id")
  @HttpCode(200)
  @HasPermissions([MANAGE_MEASURES], "any")
  async deleteFile(@Param("id") id: string) {
    return this.netAllyService.deleteFile(id);
  }
}
