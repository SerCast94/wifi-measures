import { Injectable, UnauthorizedException } from "@nestjs/common";

import { AppConfigService } from "@config/app-config.service";
import { DatabaseService } from "@core/database/database.service";
import { PasswordService } from "@core/passwords/password.service";
import { AuthUserMapper } from "../models/mappers/auth-user.mapper";
import { DatabaseException } from "@core/exceptions/technical-exceptions";
import { AuthUserEntity } from "@features/auth/domain/entities/auth-user.entity";
import { IAuthRepository } from "@features/auth/domain/interfaces/auth-repository.interface";

@Injectable()
export class DatabaseAuthRepository implements IAuthRepository {
  constructor(
    private readonly database: DatabaseService,
    private readonly passwordService: PasswordService,
    private readonly config: AppConfigService
  ) {}

  async getAuthUserById(userId: string): Promise<AuthUserEntity> {
    try {
      const db = this.database.getClient();
      if (!db) {
        throw new DatabaseException(
          this.config.get("env") === "development"
            ? "Database client not available"
            : "Error occurred while accessing the database",
          "GET_AUTH_USER_BY_ID_REPOSITORY"
        );
      }

      const authUser = await db.user.findUnique({
        where: { id: userId },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!authUser) {
        throw new UnauthorizedException("User not found");
      }

      return AuthUserMapper.databaseUserModelToUserEntity(authUser);
    } catch (error) {
      throw new DatabaseException(
        this.config.get("env") === "development"
          ? error.message
          : "Error occurred while accessing the database",
        "GET_AUTH_USER_BY_ID_REPOSITORY"
      );
    }
  }

  async authenticate(email: string, password: string): Promise<AuthUserEntity> {
    try {
      const db = this.database.getClient();
      if (!db) {
        throw new DatabaseException(
          this.config.get("env") === "development"
            ? "Database client not available"
            : "Error occurred while accessing the database",
          "AUTHENTICATE_USER_REPOSITORY"
        );
      }

      const user = await db.user.findUnique({
        where: { email },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
        },
      });

      if (!user) {
        throw new UnauthorizedException("Email no encontrado");
      }

      const isPasswordValid = await this.passwordService.comparePasswords(
        password,
        user.password as string
      );

      if (!isPasswordValid) {
        throw new UnauthorizedException(
          "La contraseña ingresada es incorrecta"
        );
      }

      return AuthUserMapper.databaseUserModelToUserEntity(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new DatabaseException(
        this.config.get("env") === "development"
          ? error.message
          : "Error occurred while accessing the database",
        "AUTHENTICATE_USER_REPOSITORY"
      );
    }
  }

  async updateAuthUser(
    userId: string,
    updateAuthUserDto: {
      name?: string;
      image?: string;
      password?: string;
    }
  ): Promise<AuthUserEntity> {
    try {
      const db = this.database.getClient();
      if (!db) {
        throw new DatabaseException(
          this.config.get("env") === "development"
            ? "Database client not available"
            : "Error occurred while accessing the database",
          "UPDATE_AUTH_USER_REPOSITORY"
        );
      }

      const user = await db.user.update({
        where: { id: userId },
        data: {
          name: updateAuthUserDto.name,
          image: updateAuthUserDto.image,
          password: updateAuthUserDto.password
            ? await this.passwordService.hashPassword(
                updateAuthUserDto.password
              )
            : undefined,
        },
        include: {
          roles: {
            include: {
              role: {
                include: {
                  permissions: {
                    include: { permission: true },
                  },
                },
              },
            },
          },
        },
      });

      return AuthUserMapper.databaseUserModelToUserEntity(user);
    } catch (error) {
      throw new DatabaseException(
        this.config.get("env") === "development"
          ? error.message
          : "Error occurred while accessing the database",
        "UPDATE_AUTH_USER_REPOSITORY"
      );
    }
  }
}
