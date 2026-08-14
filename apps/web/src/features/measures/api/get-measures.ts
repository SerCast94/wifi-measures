import apiClient from "@/core/lib/apiClient";
import { MeasureModel } from "../models/measure.model";
import { handleApiError } from "@/core/lib/errorHandler";
import type { GetMeasuresResponse } from "../types/responses.types";

const VERSION = "v1";

export const getMeasures = async (): Promise<MeasureModel[]> => {
  try {
    const { data } = await apiClient.get<GetMeasuresResponse>(
      `${VERSION}/measures`
    );

    return data.data.map((measure) => MeasureModel.fromApiMeasure(measure));
  } catch (error) {
    handleApiError(error);
  }
};
