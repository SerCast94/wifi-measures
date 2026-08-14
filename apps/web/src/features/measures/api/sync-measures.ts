import apiClient from "@/core/lib/apiClient";
import { MeasureModel } from "../models/measure.model";
import { handleApiError } from "@/core/lib/errorHandler";
import type { GetMeasuresResponse } from "../types/responses.types";

const VERSION = "v1";

export const syncMeasures = async (): Promise<MeasureModel[]> => {
  try {
    const { data } = await apiClient.post<GetMeasuresResponse>(
      `${VERSION}/measures/sync`
    );

    return data.data.map((measure) => MeasureModel.fromApiMeasure(measure));
  } catch (error) {
    handleApiError(error);
  }
};
