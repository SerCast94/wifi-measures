import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { getAnalysis } from "../api/get-analysis";
import type { LinkLiveAnalysis } from "../types/analysis.types";

export const useAnalysis = (analysisId: number) => {
  return useQuery<LinkLiveAnalysis>({
    queryKey: [QUERY_KEYS.analyses, analysisId],
    queryFn: () => getAnalysis(analysisId),
    enabled: Number.isFinite(analysisId) && analysisId > 0,
  });
};