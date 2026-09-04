import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { AppError } from "@/core/models/app-error";
import { updateFloorPlan } from "../api/update-floorplan";
import type {
  FloorPlan,
  UpdateFloorPlanPayload,
} from "../types/floorplan.types";

export const useUpdateFloorPlan = () => {
  const queryClient = useQueryClient();

  return useMutation<FloorPlan, AppError, { id: number; payload: UpdateFloorPlanPayload }>({
    mutationFn: ({ id, payload }) => updateFloorPlan(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.floorplans] });
    },
  });
};
