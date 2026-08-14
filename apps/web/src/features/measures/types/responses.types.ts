import type { AreaAnthemImage } from "./areas.types";
import type { ApiMeasure, ApiMeasureImages } from "./measure.types";
import { type ApiResponseSuccess } from "@/core/types/api-responses.types";

export type GetMeasuresResponse = ApiResponseSuccess<ApiMeasure[]>;
export type GetAreaAnthemImagesResponse = ApiResponseSuccess<AreaAnthemImage[]>;
export type GetMeasureImagesResponse = ApiResponseSuccess<ApiMeasureImages>;
export type GetAreaImagesResponse = ApiResponseSuccess<ApiMeasureImages[]>;

export type AnswerReport = "Sí" | "No" | "N/A";
