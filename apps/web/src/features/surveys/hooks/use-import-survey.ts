import { useMutation } from "@tanstack/react-query";

import { AppError } from "@/core/models/app-error";
import { importSurveyToArea } from "../api/import-survey-to-area";
import type { AreaPlan } from "@/features/measures/types/area-plan.types";

export const useImportSurveyToArea = (surveyId: number) => {
  return useMutation<AreaPlan, AppError, number>({
    mutationFn: (areaId) => importSurveyToArea(surveyId, areaId),
  });
};