import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import type { ApiResponseSuccess } from "@/core/types/api-responses.types";

const VERSION = "v1";

export const deleteSurvey = async (
  id: number
): Promise<{ deleted: boolean }> => {
  try {
    const { data } = await apiClient.delete<ApiResponseSuccess<{ deleted: boolean }>>(
      `${VERSION}/surveys/${id}`
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};
