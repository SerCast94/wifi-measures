import { Injectable } from "@nestjs/common";

import { RoleMapper } from "../models/mappers/role.mapper";
import { AppConfigService } from "@config/app-config.service";
import { DatabaseService } from "@core/database/database.service";
import { RoleEntity } from "@features/users/domain/entities/role.entity";
import { DatabaseException } from "@core/exceptions/technical-exceptions";
import { IRolesRepository } from "@features/users/domain/interfaces/roles-repository.interface";

@Injectable()
export class DatabaseRolesRepository implements IRolesRepository {
  constructor(
    private readonly database: DatabaseService,
    private readonly config: AppConfigService
  ) {}
  async getAll(): Promise<RoleEntity[]> {
    try {
      const db = this.database.getClient();
      if (!db) {
        throw new DatabaseException(
          this.config.get("env") === "development"
            ? "Database client not available"
            : "Error occurred while accessing the database",
          "GET_ALL_ROLES_REPOSITORY"
        );
      }

      const roles = await db.role.findMany({
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      return roles.map((role: any) =>
        RoleMapper.databaseRoleModelToRoleEntity(role)
      );
    } catch (error) {
      throw new DatabaseException(
        this.config.get("env") === "development"
          ? error.message
          : "Error occurred while accessing the database",
        "GET_ALL_ROLES_REPOSITORY"
      );
    }
  }

  async getById(roleId: string): Promise<RoleEntity | null> {
    try {
      const db = this.database.getClient();
      if (!db) {
        throw new DatabaseException(
          this.config.get("env") === "development"
            ? "Database client not available"
            : "Error occurred while accessing the database",
          "GET_ROLE_BY_ID_REPOSITORY"
        );
      }

      const role = await db.role.findUnique({
        where: { id: roleId },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      if (!role) {
        return null;
      }

      return RoleMapper.databaseRoleModelToRoleEntity(role);
    } catch (error) {
      throw new DatabaseException(
        this.config.get("env") === "development"
          ? error.message
          : "Error occurred while accessing the database",
        "GET_ROLE_BY_ID_REPOSITORY"
      );
    }
  }

  async getByName(username: string): Promise<RoleEntity | null> {
    try {
      const db = this.database.getClient();
      if (!db) {
        throw new DatabaseException(
          this.config.get("env") === "development"
            ? "Database client not available"
            : "Error occurred while accessing the database",
          "GET_ROLE_BY_NAME_REPOSITORY"
        );
      }

      const role = await db.role.findUnique({
        where: { name: username },
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      });

      if (!role) {
        return null;
      }

      return RoleMapper.databaseRoleModelToRoleEntity(role);
    } catch (error) {
      throw new DatabaseException(
        this.config.get("env") === "development"
          ? error.message
          : "Error occurred while accessing the database",
        "GET_ROLE_BY_NAME_REPOSITORY"
      );
    }
  }
}
