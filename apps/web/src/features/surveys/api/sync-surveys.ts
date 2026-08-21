import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import type { ApiResponseSuccess } from "@/core/types/api-responses.types";
import type { LinkLiveSurvey } from "../types/survey.types";

const VERSION = "v1";

export const syncSurveys = async (): Promise<LinkLiveSurvey[]> => {
  try {
    const { data } = await apiClient.post<ApiResponseSuccess<LinkLiveSurvey[]>>(
      `${VERSION}/surveys/sync`
    );

    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};