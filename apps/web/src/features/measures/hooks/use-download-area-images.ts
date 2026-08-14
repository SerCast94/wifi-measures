import JSZip from "jszip";
import { saveAs } from "file-saver";
import { useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import type { Area } from "../types/areas.types";
import { base64ToBlob } from "@/core/lib/imageUtils";
import { getAreaImages } from "../api/get-area-images";

export const useDownloadAreaImages = (area: Area, original = false) => {
  const queryClient = useQueryClient();
  const baseQueryKey = [QUERY_KEYS.areas, area.id, "images"];
  const queryKey = original ? [...baseQueryKey, "original"] : baseQueryKey;

  const downloadImages = async () => {
    const areaImages = await queryClient.fetchQuery({
      queryKey,
      queryFn: () => getAreaImages(`${area.id}`, original),
      staleTime: 1000 * 60 * 60, // 1 hora
    });

    const zip = new JSZip();

    for (const measureImages of areaImages) {
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
    }

    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${area.id}_${area.name}.zip`);
  };

  return { downloadImages };
};
