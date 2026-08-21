import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import type { ApiResponseSuccess } from "@/core/types/api-responses.types";
import type { LinkLiveAnalysis } from "../types/analysis.types";

const VERSION = "v1";

export const syncAnalyses = async (): Promise<LinkLiveAnalysis[]> => {
  try {
    const { data } = await apiClient.post<ApiResponseSuccess<LinkLiveAnalysis[]>>(
      `${VERSION}/analyses/sync`
    );

    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};