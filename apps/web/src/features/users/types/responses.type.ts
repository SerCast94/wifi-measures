import { type Role, type User } from "@/features/auth/types/user.type";
import { type ApiResponseSuccess } from "@/core/types/api-responses.types";

export type GetUsersResponse = ApiResponseSuccess<User[]>;
export type CreateUserResponse = ApiResponseSuccess<User>;
export type UpdateUserResponse = ApiResponseSuccess<User>;
export type DeleteUserResponse = ApiResponseSuccess<null>;
export type DeactiveUserResponse = ApiResponseSuccess<User>;
export type ActivateUserResponse = ApiResponseSuccess<User>;

export type GetRolesResponse = ApiResponseSuccess<Role[]>;
