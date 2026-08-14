import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { getAreaImages } from "../api/get-area-images";

export const useAreaImages = (areaId: string, original = false) => {
  const baseQueryKey = [QUERY_KEYS.areas, areaId, "images"];
  const queryKey = original ? [...baseQueryKey, "original"] : baseQueryKey;

  const {
    data: images,
    isLoading,
    isError,
  } = useQuery({
    queryKey,
    queryFn: () => getAreaImages(areaId, original),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  return {
    images,
    isLoading,
    isError,
  };
};
