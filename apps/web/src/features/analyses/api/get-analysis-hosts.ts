import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import type { ApiResponseSuccess } from "@/core/types/api-responses.types";
import type { AnalysisHost } from "../types/analysis.types";

const VERSION = "v1";

export const getAnalysisHosts = async (
  analysisId: number,
  hostType?: string
): Promise<AnalysisHost[]> => {
  try {
    const { data } = await apiClient.get<ApiResponseSuccess<AnalysisHost[]>>(
      `${VERSION}/analyses/${analysisId}/hosts`,
      {
        params: hostType ? { type: hostType } : undefined,
      }
    );

    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};