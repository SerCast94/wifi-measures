import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { AppError } from "@/core/models/app-error";
import { syncMeasures } from "../api/sync-measures";
import type { MeasureModel } from "../models/measure.model";

export const useSyncMeasures = () => {
  const queryClient = useQueryClient();
  const mutation = useMutation<MeasureModel[], AppError, undefined>({
    mutationFn: syncMeasures,
    onSuccess: async (newMeasures: MeasureModel[]) => {
      queryClient.setQueryData<MeasureModel[]>(
        [QUERY_KEYS.measures],
        (oldMeasures) => {
          return oldMeasures ? [...oldMeasures, ...newMeasures] : newMeasures;
        }
      );
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.measures] });
    },
  });

  return mutation;
};
