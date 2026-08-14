import { UserEntity } from "../entities/user.entity";

export interface CreateUserDto {
  username: string;
  email: string;
  name: string;
  password: string;
  image?: string;
  roles: string[];
}

export interface UpdateUserDto {
  username?: string;
  email?: string;
  name?: string;
  password?: string;
  image?: string;
  roles?: string[];
}

export interface IUsersRepository {
  getAll(): Promise<UserEntity[]>;
  getById(userId: string): Promise<UserEntity | null>;
  getByUsername(username: string): Promise<UserEntity | null>;
  getByEmail(email: string): Promise<UserEntity | null>;
  create(user: CreateUserDto): Promise<UserEntity>;
  update(userId: string, user: Partial<UserEntity>): Promise<UserEntity>;
  delete(userId: string): Promise<void>;
  deactivate(userId: string): Promise<UserEntity>;
  reactivate(userId: string): Promise<UserEntity>;
}
