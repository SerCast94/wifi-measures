import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { AppError } from "@/core/models/app-error";
import { syncSurveys } from "../api/sync-surveys";
import type { LinkLiveSurvey } from "../types/survey.types";

export const useSyncSurveys = () => {
  const queryClient = useQueryClient();

  return useMutation<LinkLiveSurvey[], AppError, undefined>({
    mutationFn: syncSurveys,
    onSuccess: async (newSurveys) => {
      queryClient.setQueryData<LinkLiveSurvey[]>(
        [QUERY_KEYS.surveys],
        () => newSurveys
      );
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.surveys] });
    },
  });
};