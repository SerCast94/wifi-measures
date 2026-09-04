import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { AppError } from "@/core/models/app-error";
import { createFloorPlan } from "../api/create-floorplan";
import type {
  CreateFloorPlanPayload,
  FloorPlan,
} from "../types/floorplan.types";

export const useCreateFloorPlan = () => {
  const queryClient = useQueryClient();

  return useMutation<FloorPlan, AppError, CreateFloorPlanPayload>({
    mutationFn: createFloorPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.floorplans] });
    },
  });
};
