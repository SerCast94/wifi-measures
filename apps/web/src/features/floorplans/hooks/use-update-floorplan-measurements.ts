import { useMutation } from "@tanstack/react-query";

import { AppError } from "@/core/models/app-error";
import { updateFloorPlanMeasurements } from "@/features/netally/api/netally.api";
import type { UpdateFloorPlanMeasurementsPayload } from "@/features/netally/types/netally.types";

export const useUpdateFloorPlanMeasurements = () => {
  return useMutation<boolean, AppError, UpdateFloorPlanMeasurementsPayload>({
    mutationFn: updateFloorPlanMeasurements,
  });
};