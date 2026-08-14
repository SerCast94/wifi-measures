import { PermissionModel } from "../user.model";
import { PermissionEntity } from "@features/users/domain/entities/permission.entity";

export class PermissionMapper {
  static fromDatabaseToEntity(permission: PermissionModel): PermissionEntity {
    return {
      id: permission.id,
      name: permission.name,
      description: permission.description as string,
      createdAt: permission.createdAt ?? new Date(),
      updatedAt: permission.updatedAt ?? new Date(),
    };
  }
}
