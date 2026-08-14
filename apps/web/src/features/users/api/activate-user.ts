import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import { type User } from "@/features/auth/types/user.type";
import { type ActivateUserResponse } from "../types/responses.type";

const VERSION = "v1";

export const activateUser = async ({
  userId,
}: {
  userId: string;
}): Promise<User> => {
  try {
    const { data: response } = await apiClient.put<ActivateUserResponse>(
      `${VERSION}/users/${userId}/activate`
    );

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};
