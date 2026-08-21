import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { getNetAllyDashboard } from "@/features/netally/api/netally.api";

export const useNetAllyDashboard = () => {
  return useQuery({
    queryKey: [QUERY_KEYS.netallyDashboard],
    queryFn: getNetAllyDashboard,
    staleTime: 60_000,
  });
};