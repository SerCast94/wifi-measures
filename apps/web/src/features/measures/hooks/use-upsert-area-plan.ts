import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { AppError } from "@/core/models/app-error";
import { upsertAreaPlan } from "../api/upsert-area-plan";
import type {
  AreaPlan,
  UpsertAreaPlanPayload,
} from "../types/area-plan.types";

export const useUpsertAreaPlan = (areaId: number) => {
  const queryClient = useQueryClient();

  return useMutation<AreaPlan, AppError, UpsertAreaPlanPayload>({
    mutationFn: (payload) => upsertAreaPlan(areaId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.areas, areaId, "plan"],
      });
    },
  });
};