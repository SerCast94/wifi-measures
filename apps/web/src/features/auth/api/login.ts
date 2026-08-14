import { type Session } from "../types/session.types";
import { handleApiError } from "@/core/lib/errorHandler";
import apiClient, { getCsrfToken } from "@/core/lib/apiClient";
import { type ApiResponseSuccess } from "@/core/types/api-responses.types";

const VERSION = "v1";

type ApiLoginRequest = {
  email: string;
  password: string;
};

export const login = async (credentials: ApiLoginRequest): Promise<Session> => {
  try {
    await getCsrfToken();

    const { data } = await apiClient.post<ApiResponseSuccess<Session>>(
      `${VERSION}/auth/login`,
      credentials
    );

    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};
