import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { getAnalysisHosts } from "../api/get-analysis-hosts";
import type { AnalysisHost } from "../types/analysis.types";

export const useAnalysisHosts = (analysisId: number, hostType?: string) => {
  return useQuery<AnalysisHost[]>({
    queryKey: [QUERY_KEYS.analyses, analysisId, "hosts", hostType ?? "all"],
    queryFn: () => getAnalysisHosts(analysisId, hostType),
    enabled: Number.isFinite(analysisId) && analysisId > 0,
  });
};