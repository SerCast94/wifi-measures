import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { base64ToBlob } from "@/core/lib/imageUtils";
import type { MeasureModel } from "../models/measure.model";
import { getMeasureImages } from "../api/get-measure-images";

export const useDownloadMeasureImages = (
  measure: MeasureModel,
  original = false
) => {
  const queryClient = useQueryClient();
  const baseQueryKey = [QUERY_KEYS.measures, measure.id, "images"];
  const queryKey = original ? [...baseQueryKey, "original"] : baseQueryKey;

  const downloadImages = async () => {
    const measureImages = await queryClient.fetchQuery({
      queryKey,
      queryFn: () => getMeasureImages(`${measure.id}`, original),
      staleTime: 1000 * 60 * 60, // 1 hora
    });

    const zip = new JSZip();
    const folder = zip.folder(measureImages.zipName);
    if (!folder) throw new Error("No se pudo crear la carpeta");

    measureImages.images
      .filter(({ name }) => name !== "firma")
      .forEach(({ name, base64: imageBase64 }) => {
        if (!imageBase64 || imageBase64 === "") return;
        const blob = base64ToBlob(imageBase64);
        if (!blob) return;
        folder.file(`${name}.png`, blob);
      });

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${measureImages.zipName}.zip`);
  };

  return { downloadImages };
};
