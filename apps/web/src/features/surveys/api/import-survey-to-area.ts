import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import type { ApiResponseSuccess } from "@/core/types/api-responses.types";
import type { AreaPlan } from "@/features/measures/types/area-plan.types";

const VERSION = "v1";

export const importSurveyToArea = async (
  surveyId: number,
  areaId: number
): Promise<AreaPlan> => {
  try {
    const { data } = await apiClient.post<ApiResponseSuccess<AreaPlan>>(
      `${VERSION}/surveys/${surveyId}/import-area/${areaId}`
    );

    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};