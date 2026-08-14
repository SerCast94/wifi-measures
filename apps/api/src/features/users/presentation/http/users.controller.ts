import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Req,
} from "@nestjs/common";

import { Request } from "express";
import { ApiExtraModels, ApiTags } from "@nestjs/swagger";
import { ApiResponseType } from "@core/swagger/decorators/response.decorator";

import { UserPresenter } from "./user.presenter";
import { CreateUserDto } from "./dtos/create-user.dto";
import { UpdateUserDto } from "./dtos/update-user.dto";
import { UsersService } from "@features/users/application/users.service";
import { MANAGE_USERS } from "@core/database/seeders/permissions/manage-users.permissions";
import { HasPermissions } from "@features/auth/presentation/http/decorators/permissions.decorator";

@Controller("users")
@ApiTags("Users")
@ApiExtraModels(UserPresenter)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get("")
  @HttpCode(200)
  @ApiResponseType(UserPresenter, true)
  @HasPermissions([MANAGE_USERS], "any")
  async getAll() {
    const users = await this.usersService.getAll();

    return users.map((user) => new UserPresenter(user));
  }

  @Get(":userId")
  @HttpCode(200)
  @ApiResponseType(UserPresenter, false)
  @HasPermissions([MANAGE_USERS], "any")
  async getById(@Param("userId") id: string) {
    const user = await this.usersService.getById(id);

    return user ? new UserPresenter(user) : null;
  }

  @Post("")
  @HttpCode(201)
  @ApiResponseType(UserPresenter, false)
  @HasPermissions([MANAGE_USERS], "any")
  async create(@Body() createUserDto: CreateUserDto) {
    const newUser = await this.usersService.create(createUserDto);

    return new UserPresenter(newUser);
  }

  @Put(":userId")
  @HttpCode(200)
  @ApiResponseType(UserPresenter, false)
  @HasPermissions([MANAGE_USERS], "any")
  async update(@Param("userId") id: string, @Body() userData: UpdateUserDto) {
    const user = await this.usersService.getById(id);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    if (userData.roles) {
      if (user.name === "admin") {
        throw new Error("No puedes modificar el rol del usuario admin");
      }
    }
    const updatedUser = await this.usersService.update({
      ...userData,
      userId: id,
    });

    return new UserPresenter(updatedUser);
  }

  @Delete(":userId")
  @HttpCode(204)
  @ApiResponseType(UserPresenter, false)
  @HasPermissions([MANAGE_USERS], "any")
  async delete(@Param("userId") id: string, @Req() req: Request) {
    if (req.session.userId === id) {
      throw new Error("No puedes eliminar tu propio usuario");
    }
    const user = await this.usersService.getById(id);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    if (user.username === "admin") {
      throw new Error("No puedes eliminar el usuario admin");
    }
    await this.usersService.delete(id);

    return null;
  }

  @Put(":userId/deactivate")
  @HttpCode(200)
  @ApiResponseType(UserPresenter, false)
  @HasPermissions([MANAGE_USERS], "any")
  async deactivate(@Param("userId") id: string, @Req() req: Request) {
    if (req.session.userId === id) {
      throw new Error("No puedes desactivar tu propio usuario");
    }
    const user = await this.usersService.getById(id);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    if (user.username === "admin") {
      throw new Error("No puedes desactivar el usuario admin");
    }
    const deletedUser = await this.usersService.deactivate(id);

    return new UserPresenter(deletedUser);
  }

  @Put(":userId/activate")
  @HttpCode(200)
  @ApiResponseType(UserPresenter, false)
  @HasPermissions([MANAGE_USERS], "any")
  async reactivate(@Param("userId") id: string, @Req() req: Request) {
    if (req.session.userId === id) {
      throw new Error("No puedes reactivar tu propio usuario");
    }
    const user = await this.usersService.getById(id);
    if (!user) {
      throw new Error("Usuario no encontrado");
    }
    if (user.username === "admin") {
      throw new Error("No puedes reactivar el usuario admin");
    }
    const updatedUser = await this.usersService.reactivate(id);

    return new UserPresenter(updatedUser);
  }
}
