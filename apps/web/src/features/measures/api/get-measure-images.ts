import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import type { ApiMeasureImages } from "../types/measure.types";
import type { GetMeasureImagesResponse } from "../types/responses.types";

const VERSION = "v1";

export const getMeasureImages = async (
  measureId: string,
  original?: boolean
): Promise<ApiMeasureImages> => {
  try {
    const { data } = await apiClient.get<GetMeasureImagesResponse>(
      `${VERSION}/measures/${measureId}/images`,
      {
        params: { original },
      }
    );

    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};
