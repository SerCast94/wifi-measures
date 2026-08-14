import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import type { ApiMeasureImages } from "../types/measure.types";
import type { GetAreaImagesResponse } from "../types/responses.types";

const VERSION = "v1";

export const getAreaImages = async (
  areaId: string,
  original?: boolean
): Promise<ApiMeasureImages[]> => {
  try {
    const { data } = await apiClient.get<GetAreaImagesResponse>(
      `${VERSION}/areas/${areaId}/images`,
      {
        params: { original },
      }
    );

    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};
