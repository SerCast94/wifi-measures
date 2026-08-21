import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import type { ApiResponseSuccess } from "@/core/types/api-responses.types";
import type { AreaPlan } from "@/features/measures/types/area-plan.types";

const VERSION = "v1";

export const getAreaPlan = async (areaId: number): Promise<AreaPlan | null> => {
  try {
    const { data } = await apiClient.get<ApiResponseSuccess<AreaPlan | null>>(
      `${VERSION}/areas/${areaId}/plan`
    );

    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};