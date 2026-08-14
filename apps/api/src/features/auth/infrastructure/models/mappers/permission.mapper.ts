import { AuthPermission } from "../auth-user.model";
import { AuthPermissionEntity } from "@features/auth/domain/entities/auth-permission.entity";

export class PermissionMapper {
  static fromDatabaseToEntity(
    permission: AuthPermission
  ): AuthPermissionEntity {
    return {
      id: permission.id,
      name: permission.name,
      description: permission.description as string,
      createdAt: permission.createdAt ?? new Date(),
      updatedAt: permission.updatedAt ?? new Date(),
    };
  }
}
