export class AuthUserEntity {
  id: string;
  username: string;
  email: string;
  name?: string;
  image?: string;
  active: boolean;
  createdAt: Date;
  updatedAt: Date;
  roles?: string[];
  permissions?: string[];

  constructor(partial: Partial<AuthUserEntity>) {
    Object.assign(this, partial);
  }

  static create(partial: Partial<AuthUserEntity>): AuthUserEntity {
    return new AuthUserEntity(partial);
  }

  hasSomeRole(roles: string[]): boolean {
    return this.roles?.some((role) => roles.includes(role)) ?? false;
  }

  hasAllRoles(roles: string[]): boolean {
    return roles.every((role) => this.roles?.includes(role));
  }

  hasSomePermissions(permissions: string[]): boolean {
    return (
      this.permissions?.some((permission) =>
        permissions.includes(permission)
      ) ?? false
    );
  }

  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every((permission) =>
      this.permissions?.includes(permission)
    );
  }
}
