import { Inject, Injectable } from "@nestjs/common";

import { CreateUserDto } from "./dtos/create-user.dto";
import { UserEntity } from "../domain/entities/user.entity";
import { AppConfigService } from "@config/app-config.service";
import { USERS_REPOSITORY_TOKEN } from "../domain/config/tokens";
import { validationPipe } from "@core/exceptions/pipes/validation.pipe";
import { IUsersRepository } from "../domain/interfaces/users-repository.interface";
import { UpdateUserDto } from "./dtos/update-user.dto";

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY_TOKEN)
    private readonly usersRepository: IUsersRepository,
    private readonly config: AppConfigService
  ) {}

  async getAll(): Promise<UserEntity[]> {
    try {
      return this.usersRepository.getAll();
    } catch (error) {
      if (this.config.get("env") === "development") {
        throw error;
      }
      throw new Error("Error getting users, please try again later");
    }
  }

  async getById(userId: string): Promise<UserEntity | null> {
    try {
      return this.usersRepository.getById(userId);
    } catch (error) {
      if (this.config.get("env") === "development") {
        throw error;
      }
      throw new Error("Error getting user, please try again later");
    }
  }

  async create(createDto: CreateUserDto): Promise<UserEntity> {
    await validationPipe.transform(createDto, {
      type: "body",
      metatype: CreateUserDto,
    });
    try {
      return this.usersRepository.create({ ...createDto });
    } catch (error) {
      if (this.config.get("env") === "development") {
        throw error;
      }
      throw new Error("Error creating user, please try again later");
    }
  }

  async update(updateDto: UpdateUserDto): Promise<UserEntity> {
    await validationPipe.transform(updateDto, {
      type: "body",
      metatype: UpdateUserDto,
    });
    try {
      const { userId, ...updateData } = updateDto;
      return this.usersRepository.update(userId, { ...updateData });
    } catch (error) {
      if (this.config.get("env") === "development") {
        throw error;
      }
      throw new Error("Error updating user, please try again later");
    }
  }

  async delete(userId: string): Promise<void> {
    try {
      return this.usersRepository.delete(userId);
    } catch (error) {
      if (this.config.get("env") === "development") {
        throw error;
      }
      throw new Error("Error deleting user, please try again later");
    }
  }

  async deactivate(userId: string): Promise<UserEntity> {
    try {
      return this.usersRepository.deactivate(userId);
    } catch (error) {
      if (this.config.get("env") === "development") {
        throw error;
      }
      throw new Error("Error deactivating user, please try again later");
    }
  }

  async reactivate(userId: string): Promise<UserEntity> {
    try {
      return this.usersRepository.reactivate(userId);
    } catch (error) {
      if (this.config.get("env") === "development") {
        throw error;
      }
      throw new Error("Error reactivating user, please try again later");
    }
  }
}
