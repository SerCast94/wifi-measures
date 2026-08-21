import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import type { ApiResponseSuccess } from "@/core/types/api-responses.types";
import type {
  NetAllyDashboard,
  Unit,
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