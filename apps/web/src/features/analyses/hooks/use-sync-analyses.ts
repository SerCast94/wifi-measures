import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { AppError } from "@/core/models/app-error";
import { syncAnalyses } from "../api/sync-analyses";
import type { LinkLiveAnalysis } from "../types/analysis.types";

export const useSyncAnalyses = () => {
  const queryClient = useQueryClient();

  return useMutation<LinkLiveAnalysis[], AppError, undefined>({
    mutationFn: syncAnalyses,
    onSuccess: async (newAnalyses) => {
      queryClient.setQueryData<LinkLiveAnalysis[]>(
        [QUERY_KEYS.analyses],
        () => newAnalyses
      );
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.analyses] });
    },
  });
};