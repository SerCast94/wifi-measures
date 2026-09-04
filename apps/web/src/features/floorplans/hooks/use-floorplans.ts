import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { getFloorPlans, getFloorPlansMinimal } from "../api/get-floorplans";
import type { FloorPlan } from "../types/floorplan.types";

export const useFloorPlans = () => {
  return useQuery<FloorPlan[]>({
    queryKey: [QUERY_KEYS.floorplans],
    queryFn: getFloorPlans,
  });
};

export const useFloorPlansMinimal = () => {
  return useQuery<FloorPlan[]>({
    queryKey: [QUERY_KEYS.floorplans, "minimal"],
    queryFn: getFloorPlansMinimal,
  });
};
