import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { AppError } from "@/core/models/app-error";
import { deleteMeasure } from "../api/delete-measure";

export const useDeleteMeasure = () => {
  const queryClient = useQueryClient();

  return useMutation<{ deleted: boolean }, AppError, number | string>({
    mutationFn: deleteMeasure,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.measures] });
    },
  });
};
