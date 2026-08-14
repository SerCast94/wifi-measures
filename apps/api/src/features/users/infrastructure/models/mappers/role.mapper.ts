import { RoleWithPermissons } from "../user.model";
import { PermissionMapper } from "./permission.mapper";
import { RoleEntity } from "@features/users/domain/entities/role.entity";

export class RoleMapper {
  static databaseRoleModelToRoleEntity(role: RoleWithPermissons): RoleEntity {
    return {
      id: role.id,
      name: role.name,
      label: role.label as string,
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
              (permission): permission is RoleEntity => permission !== undefined
            )
        : [],
    };
  }
}
