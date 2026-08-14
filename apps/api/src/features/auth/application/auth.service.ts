import { Inject, Injectable } from "@nestjs/common";

import { AppConfigService } from "@config/app-config.service";
import { UpdateAuthUserDto } from "./dto/update-auth-user.dto";
import { AUTH_REPOSITORY_TOKEN } from "../domain/config/tokens";
import { AuthUserEntity } from "../domain/entities/auth-user.entity";
import { IAuthRepository } from "../domain/interfaces/auth-repository.interface";

@Injectable()
export class AuthService {
  constructor(
    @Inject(AUTH_REPOSITORY_TOKEN)
    private readonly authRepository: IAuthRepository,
    private readonly config: AppConfigService
  ) {}

  async authenticate(email: string, password: string): Promise<AuthUserEntity> {
    try {
      return this.authRepository.authenticate(email, password);
    } catch (error) {
      if (this.config.get("env") === "development") {
        throw error;
      }
      throw new Error("Error authenticating user, please try again later");
    }
  }

  async getAuthUserById(userId: string): Promise<AuthUserEntity> {
    try {
      return this.authRepository.getAuthUserById(userId);
    } catch (error) {
      if (this.config.get("env") === "development") {
        throw error;
      }
      throw new Error(
        "Error getting authenticated user by id, please try again later"
      );
    }
  }

  async updateAuthUser(
    userId: string,
    updateAuthUserDto: UpdateAuthUserDto
  ): Promise<AuthUserEntity> {
    try {
      const { passwordConfirm: _passwordConfirm, ...userData } =
        updateAuthUserDto;
      return this.authRepository.updateAuthUser(userId, userData);
    } catch (error) {
      if (this.config.get("env") === "development") {
        throw error;
      }
      throw new Error(
        "Error updating authenticated user, please try again later"
      );
    }
  }
}
