import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import type { ApiResponseSuccess } from "@/core/types/api-responses.types";
import type {
  AreaPlan,
  UpsertAreaPlanPayload,
} from "@/features/measures/types/area-plan.types";

const VERSION = "v1";

export const upsertAreaPlan = async (
  areaId: number,
  payload: UpsertAreaPlanPayload
): Promise<AreaPlan> => {
  try {
    const { data } = await apiClient.put<ApiResponseSuccess<AreaPlan>>(
      `${VERSION}/areas/${areaId}/plan`,
      payload
    );

    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};