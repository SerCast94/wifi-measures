// Minimal local types to avoid depending on generated Prisma client types
export interface PermissionModel {
  id: string;
  name: string;
  label?: string | null;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RolePermissionModel {
  roleId: string;
  permissionId: string;
  assignedById?: string | null;
  assignedByAt?: Date;
  permission?: PermissionModel;
}

export interface RoleWithPermissons {
  id: string;
  name: string;
  label?: string | null;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  permissions?: RolePermissionModel[];
}

export interface UserRoleWithPermissions {
  userId: string;
  roleId: string;
  assignedById?: string | null;
  assignedByAt?: Date;
  role?: RoleWithPermissons;
}

export interface UserModel {
  id: string;
  username: string;
  email: string;
  name?: string | null;
  image?: string | null;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  roles?: UserRoleWithPermissions[];
}
