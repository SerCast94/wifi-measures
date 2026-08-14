import { Controller, Get, HttpCode } from "@nestjs/common";

import { ApiExtraModels, ApiTags } from "@nestjs/swagger";
import { ApiResponseType } from "@core/swagger/decorators/response.decorator";

import { RolePresenter } from "./role.presenter";
import { RolesService } from "@features/users/application/roles.service";

@Controller("roles")
@ApiTags("Roles")
@ApiExtraModels(RolePresenter)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get("")
  @HttpCode(200)
  @ApiResponseType(RolePresenter, true)
  async getAll() {
    const roles = await this.rolesService.getAll();

    return roles.map((role) => new RolePresenter(role));
  }
}
