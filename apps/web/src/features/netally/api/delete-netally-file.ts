import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import type { ApiResponseSuccess } from "@/core/types/api-responses.types";

const VERSION = "v1";

export const deleteNetAllyFile = async (
  id: string
): Promise<{ deleted: boolean }> => {
  try {
    const { data } = await apiClient.delete<
      ApiResponseSuccess<{ deleted: boolean }>
    >(`${VERSION}/units/files/${id}`);
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};