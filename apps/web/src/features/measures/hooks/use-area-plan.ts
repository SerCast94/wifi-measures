import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { getAreaPlan } from "../api/get-area-plan";
import type { AreaPlan } from "../types/area-plan.types";

export const useAreaPlan = (areaId: number) => {
  return useQuery<AreaPlan | null>({
    queryKey: [QUERY_KEYS.areas, areaId, "plan"],
    queryFn: () => getAreaPlan(areaId),
  });
};