import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { getSurvey } from "../api/get-survey";
import type { LinkLiveSurvey } from "../types/survey.types";

export const useSurvey = (surveyId: number) => {
  return useQuery<LinkLiveSurvey | null>({
    queryKey: [QUERY_KEYS.surveys, surveyId],
    queryFn: () => getSurvey(surveyId),
  });
};