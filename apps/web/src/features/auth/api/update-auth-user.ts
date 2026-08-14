import {
  type Session,
  type UpdateUserData,
  type UpdateUserResponse,
} from "../types/session.types";
import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";

const VERSION = "v1";

export const updateAuthUser = async (
  data: UpdateUserData
): Promise<Session> => {
  try {
    const { data: response } = await apiClient.put<UpdateUserResponse>(
      `${VERSION}/auth/me`,
      data
    );

    return response.data;
  } catch (error) {
    handleApiError(error);
  }
};
