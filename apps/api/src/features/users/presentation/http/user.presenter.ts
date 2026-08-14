import { ApiProperty } from "@nestjs/swagger";

import { UserEntity } from "@features/users/domain/entities/user.entity";

export class UserPresenter {
  @ApiProperty({ type: "number", example: 1 })
  id: string | number;
  @ApiProperty({ type: "string", example: "username" })
  username: string;
  @ApiProperty({ type: "string", example: "email" })
  email: string;
  @ApiProperty({ type: "string", example: "name" })
  name: string;
  @ApiProperty({ type: "string", example: "image" })
  image: string;
  @ApiProperty({ type: "boolean", example: true })
  active: boolean;
  @ApiProperty({ type: "string", example: new Date() })
  createdAt: Date;
  @ApiProperty({ type: "string", example: new Date() })
  updatedAt: Date;
  @ApiProperty({ type: "array" })
  roles: string[];

  constructor(user: UserEntity) {
    this.id = user.id;
    this.username = user.username;
    this.email = user.email;
    this.name = user.name || "";
    this.image = user.image || "";
    this.active = user.active;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
    this.roles = user.roles || [];
  }
}
