import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { AppError } from "@/core/models/app-error";
import { deleteSurvey } from "../api/delete-survey";

export const useDeleteSurvey = () => {
  const queryClient = useQueryClient();

  return useMutation<{ deleted: boolean }, AppError, number>({
    mutationFn: deleteSurvey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.surveys] });
    },
  });
};
