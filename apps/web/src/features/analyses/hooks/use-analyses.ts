import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { getAnalyses } from "../api/get-analyses";
import type { LinkLiveAnalysis } from "../types/analysis.types";

export const useAnalyses = () => {
  return useQuery<LinkLiveAnalysis[]>({
    queryKey: [QUERY_KEYS.analyses],
    queryFn: getAnalyses,
  });
};