import { ApiProperty } from "@nestjs/swagger";

import { RoleEntity } from "@features/users/domain/entities/role.entity";

export class RolePresenter {
  @ApiProperty({ type: "number", example: 1 })
  id: string | number;
  @ApiProperty({ type: "string", example: "admin" })
  name: string;
  @ApiProperty({ type: "string", example: "Administrador" })
  label: string;
  @ApiProperty({ type: "string", example: "Rol de Administrador" })
  description: string;
  @ApiProperty({ type: "string", example: new Date() })
  createdAt: Date;
  @ApiProperty({ type: "string", example: new Date() })
  updatedAt: Date;

  constructor(role: RoleEntity) {
    this.id = role.id;
    this.name = role.name;
    this.label = role.label;
    this.description = role.description;
    this.createdAt = role.createdAt;
    this.updatedAt = role.updatedAt;
  }
}
