import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { getSurveys } from "../api/get-surveys";
import type { LinkLiveSurvey } from "../types/survey.types";

export const useSurveys = () => {
  return useQuery<LinkLiveSurvey[]>({
    queryKey: [QUERY_KEYS.surveys],
    queryFn: getSurveys,
  });
};