import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import { type User } from "@/features/auth/types/user.type";
import { type GetUsersResponse } from "../types/responses.type";

const VERSION = "v1";

export const getUsers = async (): Promise<User[]> => {
  try {
    const { data } = await apiClient.get<GetUsersResponse>(`${VERSION}/users`);

    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};
