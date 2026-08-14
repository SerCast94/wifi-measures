import { Match } from "@core/validators/match.validator";
import {
  IsString,
  IsOptional,
  Length,
  IsNotEmpty,
  ValidateIf,
} from "class-validator";

export class UpdateAuthUserDto {
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
}
