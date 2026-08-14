import { PermissionMapper } from "./permission.mapper";
import { AuthRoleWithPermissons } from "../auth-user.model";
import { AuthRoleEntity } from "@features/auth/domain/entities/auth-role.entity";

export class RoleMapper {
  static databaseRoleModelToRoleEntity(
    role: AuthRoleWithPermissons
  ): AuthRoleEntity {
    return {
      id: role.id,
      name: role.name,
      description: role.description as string,
      createdAt: role.createdAt ?? new Date(),
      updatedAt: role.updatedAt ?? new Date(),
      permissions: role.permissions
        ? role.permissions
            .map((permission) =>
              permission.permission
                ? PermissionMapper.fromDatabaseToEntity(permission.permission)
                : undefined
            )
            .filter(
              (permission): permission is AuthRoleEntity =>
                permission !== undefined
            )
        : [],
    };
  }
}
