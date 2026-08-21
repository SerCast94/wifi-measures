import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { getUnits } from "@/features/netally/api/netally.api";

export const useUnits = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.units],
    queryFn: getUnits,
  });
};