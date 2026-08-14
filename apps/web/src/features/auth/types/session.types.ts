import { type User } from "@/features/auth/types/user.type";
import { type ApiResponseSuccess } from "@/core/types/api-responses.types";

export type SessionResponse = ApiResponseSuccess<Session>;
export type UpdateUserResponse = ApiResponseSuccess<Session>;

export type UpdateUserData = {
  name?: string;
  password?: string;
  passwordConfirm?: string;
};

export type Session = {
  user: User;
  expiresAt: number;
};
