import {
  IsString,
  IsOptional,
  Length,
  IsNotEmpty,
  IsEmail,
  IsArray,
} from "class-validator";

import { Match } from "@core/validators/match.validator";
import { IsValidRoles } from "../decorators/is-valid-roles.decorator";
import { IsUniqueEmail } from "../decorators/is-unique-email.decorator";
import { IsUniqueUsername } from "../decorators/is-unique-username.decorator";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  @IsUniqueUsername(undefined, {
    message: "El nombre de usuario ya está en uso",
  })
  username: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  @IsEmail()
  @IsUniqueEmail(undefined, {
    message: "El correo electrónico ya está en uso",
  })
  email: string;

  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  name: string;

  @IsString()
  @IsNotEmpty()
  @Length(6, 20)
  password: string;

  @IsString()
  @IsNotEmpty()
  @Match("password", { message: "Las contraseñas no coinciden" })
  passwordConfirm: string;

  @IsOptional()
  @IsString()
  @Length(0, 255)
  image?: string;

  @IsArray()
  @IsString({ each: true })
  @IsValidRoles({
    message: "Existen roles inválidos",
  })
  roles: string[];
}
