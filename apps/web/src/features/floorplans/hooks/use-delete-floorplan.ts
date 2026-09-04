import { useMutation, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { AppError } from "@/core/models/app-error";
import { deleteFloorPlan } from "../api/delete-floorplan";

export const useDeleteFloorPlan = () => {
  const queryClient = useQueryClient();

  return useMutation<{ deleted: boolean }, AppError, number>({
    mutationFn: deleteFloorPlan,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.floorplans] });
    },
  });
};
