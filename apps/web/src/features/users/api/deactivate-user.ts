import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import { type User } from "@/features/auth/types/user.type";
import { type DeactiveUserResponse } from "../types/responses.type";

const VERSION = "v1";

export const deactivateUser = async ({
  userId,
}: {
  userId: string;
}): Promise<User> => {
  try {
    const { data: response } = await apiClient.put<DeactiveUserResponse>(
      `${VERSION}/users/${userId}/deactivate`
    );

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};
