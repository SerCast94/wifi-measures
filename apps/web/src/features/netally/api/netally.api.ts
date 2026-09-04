import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import type { ApiResponseSuccess } from "@/core/types/api-responses.types";
import type {
  NetAllyDashboard,
  Unit,
  UpdateFloorPlanMeasurementsPayload,
  UploadFloorPlanPayload,
  UploadFloorPlanResult,
} from "@/features/netally/types/netally.types";

const VERSION = "v1";

export const getUnits = async (): Promise<Unit[]> => {
  try {
    const { data } = await apiClient.get<ApiResponseSuccess<Unit[]>>(
      `${VERSION}/units`
    );

    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getNetAllyDashboard = async (): Promise<NetAllyDashboard | null> => {
  try {
    const { data } = await apiClient.get<
      ApiResponseSuccess<NetAllyDashboard>
    >(`${VERSION}/dashboard/netally`);

    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const uploadFloorPlan = async (
  payload: UploadFloorPlanPayload
): Promise<UploadFloorPlanResult | undefined> => {
  const { data } = await apiClient.post<
    ApiResponseSuccess<UploadFloorPlanResult>
  >(`${VERSION}/floorplans/upload`, payload);
  return data.data;
};

export const updateFloorPlanMeasurements = async (
  payload: UpdateFloorPlanMeasurementsPayload
): Promise<boolean> => {
  const { data } = await apiClient.patch<ApiResponseSuccess<boolean>>(
    `${VERSION}/floorplans/measurements`,
    payload
  );
  return data.data;
};