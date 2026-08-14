import {
  Body,
  Controller,
  Get,
  HttpCode,
  InternalServerErrorException,
  Post,
  Put,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";

import { Request, Response } from "express";
import { ApiExtraModels, ApiTags } from "@nestjs/swagger";

import { LoginDto } from "./dtos/login.dto";
import { AuthPresenter } from "./auth.presenter";
import { AuthUserPresenter } from "./auth-user.presenter";
import { AppConfigService } from "@config/app-config.service";
import { AuthService } from "@features/auth/application/auth.service";
import { Public } from "@core/session/decorators/is-public.decorator";
import { ApiResponseType } from "@core/swagger/decorators/response.decorator";
import { UpdateAuthUserDto } from "./dtos/update-auth-user.dto";

@Controller("auth")
@ApiTags("Auth")
@ApiExtraModels(AuthPresenter, AuthUserPresenter)
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: AppConfigService
  ) {}

  @Post("login")
  @HttpCode(200)
  @Public()
  @ApiResponseType(AuthPresenter, false)
  async login(@Body() authDto: LoginDto, @Req() req: Request) {
    const { email, password } = authDto;
    const authUser = await this.authService.authenticate(email, password);

    if (!authUser || !authUser.active) {
      throw new UnauthorizedException("Usuario no encontrado o inactivo");
    }

    req.session.userId = authUser.id;

    return new AuthPresenter(req.session, authUser);
  }

  @Post("logout")
  @HttpCode(204)
  async logout(@Req() req: Request, @Res() res: Response) {
    req.session.destroy((err: any) => {
      if (err) {
        throw new InternalServerErrorException(
          "Session could not be destroyed"
        );
      }

      res.clearCookie(this.config.get("sessionCookieName"), { path: "/" });

      return res.status(204).send();
    });
  }

  @Get("me")
  @HttpCode(200)
  @ApiResponseType(AuthPresenter, false)
  async me(@Req() req: Request) {
    const userId = req.session.userId;
    if (!userId) {
      throw new UnauthorizedException("Usuario no autenticado");
    }

    const authUser = await this.authService.getAuthUserById(userId);
    if (!authUser || !authUser.active) {
      req.session.destroy();
      throw new UnauthorizedException("Usuario no encontrado o inactivo");
    }

    return new AuthPresenter(req.session, authUser);
  }

  @Put("me")
  @HttpCode(200)
  @ApiResponseType(AuthPresenter, false)
  async updateMe(@Req() req: Request, @Body() authUser: UpdateAuthUserDto) {
    const userId = req.session.userId;
    if (!userId) {
      throw new UnauthorizedException("Usuario no autenticado");
    }

    const updatedUser = await this.authService.updateAuthUser(userId, authUser);

    return new AuthPresenter(req.session, updatedUser);
  }
}
