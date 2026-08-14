// Minimal local types to avoid direct dependency on generated Prisma client types
export interface AuthPermission {
  id: string;
  name: string;
  label?: string | null;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface AuthRolePermission {
  roleId: string;
  permissionId: string;
  assignedById?: string | null;
  assignedByAt?: Date;
  permission?: AuthPermission;
}

export interface AuthRoleWithPermissons {
  id: string;
  name: string;
  label?: string | null;
  description?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  permissions?: AuthRolePermission[];
}

export interface AuthUserRoleWithPermissions {
  userId: string;
  roleId: string;
  assignedById?: string | null;
  assignedByAt?: Date;
  role?: AuthRoleWithPermissons;
}

export interface AuthUser {
  id: string;
  username: string;
  email: string;
  name?: string | null;
  image?: string | null;
  active?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
  roles?: AuthUserRoleWithPermissions[];
}
