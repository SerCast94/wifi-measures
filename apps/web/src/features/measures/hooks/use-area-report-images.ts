import { useQueryClient } from "@tanstack/react-query";
import type { AreaAnthemImage } from "../types/areas.types";
import { getQueryAreaFotoAntena } from "../lib/reports.helper";

export const useAreaReportImages = (areaId: string) => {
  const queryClient = useQueryClient();

  const fetchImages = async (): Promise<AreaAnthemImage[]> => {
    return getQueryAreaFotoAntena(areaId, queryClient);
  };

  return { fetchImages };
};
