import {
  IsString,
  IsOptional,
  Length,
  IsNotEmpty,
  IsArray,
  IsEmail,
  ValidateIf,
} from "class-validator";

import { Match } from "@core/validators/match.validator";
import { IsValidRoles } from "../decorators/is-valid-roles.decorator";
import { IsUniqueEmail } from "../decorators/is-unique-email.decorator";
import { IsValidUserId } from "../decorators/is-valid-user-id.decorator";
import { IsUniqueUsername } from "../decorators/is-unique-username.decorator";

export class UpdateUserDto {
  @IsString()
  @IsNotEmpty()
  @IsValidUserId()
  userId: string;

  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @Length(3, 100)
  @IsUniqueUsername("userId", {
    message: "El nombre de usuario ya está en uso",
  })
  username?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsEmail()
  @Length(3, 100)
  @IsUniqueEmail("userId", {
    message: "El correo electrónico ya está en uso",
  })
  email?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  name?: string;

  @IsOptional()
  @IsString()
  @Length(6, 20)
  password?: string;

  @ValidateIf((o) => o.password !== undefined)
  @IsString()
  @Match("password", { message: "Las contraseñas no coinciden" })
  passwordConfirm?: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  image?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsValidRoles({
    message: "Existen roles inválidos",
  })
  roles?: string[];
}
