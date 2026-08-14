import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import { type Role } from "@/features/auth/types/user.type";
import { type GetRolesResponse } from "../types/responses.type";

const VERSION = "v1";

export const getRoles = async (): Promise<Role[]> => {
  try {
    const { data } = await apiClient.get<GetRolesResponse>(`${VERSION}/roles`);

    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};
