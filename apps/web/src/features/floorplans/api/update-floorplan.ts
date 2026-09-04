import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import type { ApiResponseSuccess } from "@/core/types/api-responses.types";
import type {
  FloorPlan,
  UpdateFloorPlanPayload,
} from "../types/floorplan.types";

const VERSION = "v1";

export const updateFloorPlan = async (
  id: number,
  payload: UpdateFloorPlanPayload
): Promise<FloorPlan> => {
  try {
    const { data } = await apiClient.patch<ApiResponseSuccess<FloorPlan>>(
      `${VERSION}/floorplans/${id}`,
      payload
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};
