import { Injectable, UnauthorizedException } from "@nestjs/common";

import { UserMapper } from "../models/mappers/user.mapper";
import { AppConfigService } from "@config/app-config.service";
import { DatabaseService } from "@core/database/database.service";
import { PasswordService } from "@core/passwords/password.service";
import { UserEntity } from "@features/users/domain/entities/user.entity";
import { DatabaseException } from "@core/exceptions/technical-exceptions";
import {
  CreateUserDto,
  IUsersRepository,
  UpdateUserDto,
} from "@features/users/domain/interfaces/users-repository.interface";

@Injectable()
export class DatabaseUsersRepository implements IUsersRepository {
  constructor(
    private readonly database: DatabaseService,
    private readonly passwordService: PasswordService,
    private readonly config: AppConfigService
  ) {}
  async getAll(): Promise<UserEntity[]> {
    try {
      const db = this.database.getClient();
      if (!db) {
        throw new DatabaseException(
          this.config.get("env") === "development"
            ? "Database client not available"
            : "Error occurred while accessing the database",
          "GET_ALL_USERS_REPOSITORY"
        );
      }

      const users = await db.user.findMany({
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      return users.map((user: any) =>
        UserMapper.databaseUserModelToUserEntity(user)
      );
    } catch (error) {
      throw new DatabaseException(
        this.config.get("env") === "development"
          ? error.message
          : "Error occurred while accessing the database",
        "GET_ALL_USERS_REPOSITORY"
      );
    }
  }

  async getById(userId: string): Promise<UserEntity | null> {
    try {
      const db = this.database.getClient();
      if (!db) {
        throw new DatabaseException(
          this.config.get("env") === "development"
            ? "Database client not available"
            : "Error occurred while accessing the database",
          "GET_USER_BY_ID_REPOSITORY"
        );
      }

      const user = await db.user.findUnique({
        where: { id: userId },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        return null;
      }

      return UserMapper.databaseUserModelToUserEntity(user);
    } catch (error) {
      throw new DatabaseException(
        this.config.get("env") === "development"
          ? error.message
          : "Error occurred while accessing the database",
        "GET_USER_BY_ID_REPOSITORY"
      );
    }
  }

  async getByUsername(username: string): Promise<UserEntity | null> {
    try {
      const db = this.database.getClient();
      if (!db) {
        throw new DatabaseException(
          this.config.get("env") === "development"
            ? "Database client not available"
            : "Error occurred while accessing the database",
          "GET_USER_BY_USERNAME_REPOSITORY"
        );
      }

      const user = await db.user.findUnique({
        where: { username },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        return null;
      }

      return UserMapper.databaseUserModelToUserEntity(user);
    } catch (error) {
      throw new DatabaseException(
        this.config.get("env") === "development"
          ? error.message
          : "Error occurred while accessing the database",
        "GET_USER_BY_USERNAME_REPOSITORY"
      );
    }
  }

  async getByEmail(email: string): Promise<UserEntity | null> {
    try {
      const db = this.database.getClient();
      if (!db) {
        throw new DatabaseException(
          this.config.get("env") === "development"
            ? "Database client not available"
            : "Error occurred while accessing the database",
          "GET_USER_BY_EMAIL_REPOSITORY"
        );
      }

      const user = await db.user.findUnique({
        where: { email },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!user) {
        return null;
      }

      return UserMapper.databaseUserModelToUserEntity(user);
    } catch (error) {
      throw new DatabaseException(
        this.config.get("env") === "development"
          ? error.message
          : "Error occurred while accessing the database",
        "GET_USER_BY_EMAIL_REPOSITORY"
      );
    }
  }

  async create(user: CreateUserDto): Promise<UserEntity> {
    try {
      const db = this.database.getClient();
      if (!db) {
        throw new DatabaseException(
          this.config.get("env") === "development"
            ? "Database client not available"
            : "Error occurred while accessing the database",
          "CREATE_USER_REPOSITORY"
        );
      }

      const newUser = await db.user.create({
        data: {
          username: user.username,
          email: user.email,
          name: user.name,
          image: user.image,
          password: await this.passwordService.hashPassword(user.password),
          roles: {
            create: user.roles.map((roleId) => ({
              role: {
                connect: { id: roleId },
              },
            })),
          },
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      return UserMapper.databaseUserModelToUserEntity(newUser);
    } catch (error) {
      throw new DatabaseException(
        this.config.get("env") === "development"
          ? error.message
          : "Error occurred while accessing the database",
        "CREATE_USER_REPOSITORY"
      );
    }
  }

  async update(userId: string, user: UpdateUserDto): Promise<UserEntity> {
    try {
      const db = this.database.getClient();
      if (!db) {
        throw new DatabaseException(
          this.config.get("env") === "development"
            ? "Database client not available"
            : "Error occurred while accessing the database",
          "UPDATE_USER_REPOSITORY"
        );
      }

      const { roles, ...userData } = user;
      const updatedUser = await db.user.update({
        where: { id: userId },
        data: {
          username: userData.username,
          email: userData.email,
          name: userData.name,
          image: userData.image,
          password: userData.password
            ? await this.passwordService.hashPassword(userData.password)
            : undefined,
          roles: roles
            ? {
                deleteMany: {},
                createMany: {
                  data: roles.map((roleId) => ({
                    roleId: roleId,
                  })),
                },
              }
            : undefined,
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      return UserMapper.databaseUserModelToUserEntity(updatedUser);
    } catch (error) {
      throw new DatabaseException(
        this.config.get("env") === "development"
          ? error.message
          : "Error occurred while accessing the database",
        "UPDATE_USER_REPOSITORY"
      );
    }
  }

  async delete(userId: string): Promise<void> {
    try {
      const db = this.database.getClient();
      if (!db) {
        throw new DatabaseException(
          this.config.get("env") === "development"
            ? "Database client not available"
            : "Error occurred while accessing the database",
          "DELETE_USER_REPOSITORY"
        );
      }

      await db.user.delete({
        where: { id: userId },
      });
    } catch (error) {
      throw new DatabaseException(
        this.config.get("env") === "development"
          ? error.message
          : "Error occurred while accessing the database",
        "DELETE_USER_REPOSITORY"
      );
    }
  }

  async deactivate(userId: string): Promise<UserEntity> {
    try {
      const db = this.database.getClient();
      if (!db) {
        throw new DatabaseException(
          this.config.get("env") === "development"
            ? "Database client not available"
            : "Error occurred while accessing the database",
          "DEACTIVATE_USER_REPOSITORY"
        );
      }

      const deletedUser = await db.user.update({
        where: { id: userId },
        data: {
          active: false,
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!deletedUser) {
        throw new UnauthorizedException("User not found");
      }

      return UserMapper.databaseUserModelToUserEntity(deletedUser);
    } catch (error) {
      throw new DatabaseException(
        this.config.get("env") === "development"
          ? error.message
          : "Error occurred while accessing the database",
        "DEACTIVATE_USER_REPOSITORY"
      );
    }
  }

  async reactivate(userId: string): Promise<UserEntity> {
    try {
      const db = this.database.getClient();
      if (!db) {
        throw new DatabaseException(
          this.config.get("env") === "development"
            ? "Database client not available"
            : "Error occurred while accessing the database",
          "REACTIVATE_USER_REPOSITORY"
        );
      }

      const reactivatedUser = await db.user.update({
        where: { id: userId },
        data: {
          active: true,
        },
        include: {
          roles: {
            include: {
              role: true,
            },
          },
        },
      });

      if (!reactivatedUser) {
        throw new UnauthorizedException("User not found");
      }

      return UserMapper.databaseUserModelToUserEntity(reactivatedUser);
    } catch (error) {
      throw new DatabaseException(
        this.config.get("env") === "development"
          ? error.message
          : "Error occurred while accessing the database",
        "REACTIVATE_USER_REPOSITORY"
      );
    }
  }
}
