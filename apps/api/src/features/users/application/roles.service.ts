import { Inject, Injectable } from "@nestjs/common";

import { RoleEntity } from "../domain/entities/role.entity";
import { AppConfigService } from "@config/app-config.service";
import { ROLES_REPOSITORY_TOKEN } from "../domain/config/tokens";
import { IRolesRepository } from "../domain/interfaces/roles-repository.interface";

@Injectable()
export class RolesService {
  constructor(
    @Inject(ROLES_REPOSITORY_TOKEN)
    private readonly rolesRepository: IRolesRepository,
    private readonly config: AppConfigService
  ) {}

  async getAll(): Promise<RoleEntity[]> {
    try {
      return this.rolesRepository.getAll();
    } catch (error) {
      if (this.config.get("env") === "development") {
        throw error;
      }
      throw new Error("Error getting roles, please try again later");
    }
  }
}
