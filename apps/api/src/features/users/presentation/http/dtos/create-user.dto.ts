import { Match } from "@core/validators/match.validator";
import {
  IsString,
  IsOptional,
  Length,
  IsNotEmpty,
  IsArray,
  IsEmail,
} from "class-validator";

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(3, 100)
  username: string;

  @IsString()
  @IsNotEmpty()
  @IsEmail()
  @Length(3, 100)
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
  roles: string[];
}
