import { RoleEntity } from "../entities/role.entity";

export interface IRolesRepository {
  getAll(): Promise<RoleEntity[]>;
  getById(id: string): Promise<RoleEntity | null>;
  getByName(name: string): Promise<RoleEntity | null>;
}
