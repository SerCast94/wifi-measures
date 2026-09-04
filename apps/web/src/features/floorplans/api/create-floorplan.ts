import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import type { ApiResponseSuccess } from "@/core/types/api-responses.types";
import type {
  CreateFloorPlanPayload,
  FloorPlan,
} from "../types/floorplan.types";

const VERSION = "v1";

export const createFloorPlan = async (
  payload: CreateFloorPlanPayload
): Promise<FloorPlan> => {
  try {
    const { data } = await apiClient.post<ApiResponseSuccess<FloorPlan>>(
      `${VERSION}/floorplans`,
      payload
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};
