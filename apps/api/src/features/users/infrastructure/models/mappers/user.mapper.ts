import { UserModel } from "../user.model";
import { UserEntity } from "@features/users/domain/entities/user.entity";

export class UserMapper {
  static databaseUserModelToUserEntity(user: UserModel): UserEntity {
    let roles = undefined;
    let permissions: any = undefined;
    if (user.roles && user.roles.length > 0) {
      roles = user.roles
        .map((role) => {
          const currentRole = role.role;
          return currentRole?.name;
        })
        .filter((roleName): roleName is string => roleName !== undefined);

      user.roles.forEach((role) => {
        if (!role.role?.permissions) {
          return;
        }

        const rolePermissions = role.role.permissions.map((permission) => {
          const currentPermission = permission.permission;
          return currentPermission?.name;
        });

        if (permissions) {
          permissions = [...permissions, ...rolePermissions];
        } else {
          permissions = rolePermissions;
        }
      });
    }
    return UserEntity.create({
      id: user.id,
      username: user.username,
      email: user.email,
      name: user.name ?? undefined,
      image: user.image || undefined,
      active: user.active,
      createdAt: user.createdAt ?? new Date(),
      updatedAt: user.updatedAt ?? new Date(),
      roles,
      permissions,
    });
  }
}
