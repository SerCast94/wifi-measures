import { AuthPermissionEntity } from "./auth-permission.entity";

export class AuthRoleEntity {
  id: string | number;
  name: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  permissions: AuthPermissionEntity[];
}
