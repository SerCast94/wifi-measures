import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import { type User } from "@/features/auth/types/user.type";
import { type UpdateUserResponse } from "../types/responses.type";
import { type UpdateFormValues } from "../types/update-user.schema";

const VERSION = "v1";

export const updateUser = async ({
  userId,
  data,
}: {
  userId: string;
  data: UpdateFormValues;
}): Promise<User> => {
  try {
    const { data: response } = await apiClient.put<UpdateUserResponse>(
      `${VERSION}/users/${userId}`,
      data
    );

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};
