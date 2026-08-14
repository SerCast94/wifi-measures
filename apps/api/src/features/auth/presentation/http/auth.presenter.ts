import { Request } from "express";
import { ApiProperty } from "@nestjs/swagger";

import { AuthUserPresenter } from "./auth-user.presenter";
import { AuthUserEntity } from "@features/auth/domain/entities/auth-user.entity";

export class AuthPresenter {
  @ApiProperty()
  userId: string | number;

  @ApiProperty()
  expires: string;

  @ApiProperty()
  user: AuthUserPresenter;

  constructor(session: Request["session"], user: AuthUserEntity) {
    this.userId = session.userId;
    this.expires = session.cookie.expires.toISOString();
    this.user = new AuthUserPresenter(user);
  }
}
