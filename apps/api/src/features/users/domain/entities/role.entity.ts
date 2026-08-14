import { PermissionEntity } from "./permission.entity";

export class RoleEntity {
  id: string | number;
  name: string;
  label: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
  permissions: PermissionEntity[];
}
