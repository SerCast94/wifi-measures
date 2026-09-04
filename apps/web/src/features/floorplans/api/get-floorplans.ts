import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import type { ApiResponseSuccess } from "@/core/types/api-responses.types";
import type { FloorPlan } from "../types/floorplan.types";

const VERSION = "v1";

export const getFloorPlans = async (): Promise<FloorPlan[]> => {
  try {
    const { data } = await apiClient.get<ApiResponseSuccess<FloorPlan[]>>(
      `${VERSION}/floorplans`
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getFloorPlansMinimal = async (): Promise<FloorPlan[]> => {
  try {
    const { data } = await apiClient.get<ApiResponseSuccess<FloorPlan[]>>(
      `${VERSION}/floorplans?minimal=true`
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};
