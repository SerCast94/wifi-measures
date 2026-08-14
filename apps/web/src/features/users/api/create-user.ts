import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import { type User } from "@/features/auth/types/user.type";
import { type CreateUserResponse } from "../types/responses.type";
import { type CreateFormValues } from "../types/create-user.schema";

const VERSION = "v1";

export const createUser = async (data: CreateFormValues): Promise<User> => {
  try {
    const { data: response } = await apiClient.post<CreateUserResponse>(
      `${VERSION}/users`,
      data
    );

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};
