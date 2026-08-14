import { Injectable } from "@nestjs/common";

import * as bcrypt from "bcryptjs";

@Injectable()
export class PasswordService {
  private readonly saltRounds = 10;

  // Encripta una contraseña
  async hashPassword(password: string): Promise<string> {
    return await bcrypt.hash(password, this.saltRounds);
  }

  // Compara una contraseña en texto plano con su hash
  async comparePasswords(
    plainPassword: string,
    hashedPassword: string
  ): Promise<boolean> {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}
