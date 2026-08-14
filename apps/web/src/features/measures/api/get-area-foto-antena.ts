import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import type { AreaAnthemImage } from "../types/areas.types";
import type { GetAreaAnthemImagesResponse } from "../types/responses.types";

const VERSION = "v1";

export const getAreaFotoAntena = async (
  areaId: string
): Promise<AreaAnthemImage[]> => {
  try {
    const { data } = await apiClient.get<GetAreaAnthemImagesResponse>(
      `${VERSION}/areas/${areaId}/fotoAnthems`
    );

    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};
