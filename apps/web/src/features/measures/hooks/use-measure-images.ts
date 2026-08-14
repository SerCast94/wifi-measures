import { useMemo } from "react";

import { useQuery } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { getMeasureImages } from "../api/get-measure-images";

export const useMeasureImages = (measureId: string, original = false) => {
  const baseQueryKey = [QUERY_KEYS.measures, measureId, "images"];
  const queryKey = original ? [...baseQueryKey, "original"] : baseQueryKey;

  const {
    data: images,
    isLoading,
    isError,
  } = useQuery({
    queryKey,
    queryFn: () => getMeasureImages(measureId, original),
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const fotoAntenaImage = useMemo(() => {
    return (
      images?.images.find((img) => img.name === "fotoAntena")?.base64 || null
    );
  }, [images]);

  const firmaImage = useMemo(() => {
    return images?.images.find((img) => img.name === "firma")?.base64 || null;
  }, [images]);

  return {
    images,
    fotoAntenaImage,
    firmaImage,
    isLoading,
    isError,
  };
};
