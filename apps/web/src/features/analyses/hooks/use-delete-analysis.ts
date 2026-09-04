import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { AppError } from "@/core/models/app-error";
import { deleteAnalysis } from "../api/delete-analysis";

export const useDeleteAnalysis = () => {
  const queryClient = useQueryClient();

  return useMutation<{ deleted: boolean }, AppError, number>({
    mutationFn: deleteAnalysis,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.analyses] });
    },
  });
};
