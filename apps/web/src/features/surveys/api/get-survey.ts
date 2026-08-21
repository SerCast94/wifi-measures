import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import type { ApiResponseSuccess } from "@/core/types/api-responses.types";
import type { LinkLiveSurvey } from "../types/survey.types";

const VERSION = "v1";

export const getSurvey = async (
  surveyId: number
): Promise<LinkLiveSurvey | null> => {
  try {
    const { data } = await apiClient.get<
      ApiResponseSuccess<LinkLiveSurvey | null>
    >(`${VERSION}/surveys/${surveyId}`);

    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};