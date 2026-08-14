import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import { type DeleteUserResponse } from "../types/responses.type";

const VERSION = "v1";

export const deleteUser = async ({
  userId,
}: {
  userId: string;
}): Promise<string> => {
  try {
    await apiClient.delete<DeleteUserResponse>(`${VERSION}/users/${userId}`);

    return userId;
  } catch (error) {
    handleApiError(error);
  }
};
