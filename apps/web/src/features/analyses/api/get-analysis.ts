import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import type { ApiResponseSuccess } from "@/core/types/api-responses.types";
import type { LinkLiveAnalysis } from "../types/analysis.types";

const VERSION = "v1";

export const getAnalysis = async (
  analysisId: number
): Promise<LinkLiveAnalysis> => {
  try {
    const { data } = await apiClient.get<ApiResponseSuccess<LinkLiveAnalysis>>(
      `${VERSION}/analyses/${analysisId}`
    );

    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};