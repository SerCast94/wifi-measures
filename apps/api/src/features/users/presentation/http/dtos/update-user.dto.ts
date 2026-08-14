import { Match } from "@core/validators/match.validator";
import {
  IsString,
  IsOptional,
  Length,
  IsNotEmpty,
  IsArray,
  IsEmail,
  ValidateIf,
} from "class-validator";

export class UpdateUserDto {
  @IsOptional()
  @IsNotEmpty()
  @IsString()
  @Length(3, 100)
  username?: string;

  @IsOptional()
  @IsNotEmpty()
  @IsEmail()
  @Length(3, 100)
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
  roles?: string[];
}
