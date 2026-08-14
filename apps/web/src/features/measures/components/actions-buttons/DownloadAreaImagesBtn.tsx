import { forwardRef, useState } from "react";

import { toast } from "sonner";
import { FileImageIcon } from "lucide-react";

import type { Area } from "../../types/areas.types";
import { LoadingButton } from "@/core/atomic-components/loading-button";
import { useDownloadAreaImages } from "../../hooks/use-download-area-images";

interface DownloadAreaImagesBtnProps {
  area: Area;
  className?: string;
  withLabel?: boolean;
  title?: string;
}

export const DownloadAreaImagesBtn = forwardRef<
  HTMLButtonElement,
  DownloadAreaImagesBtnProps
>(
  (
    { area, className, withLabel = false, title = "Descargar Imágenes" },
    ref
  ) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const { downloadImages } = useDownloadAreaImages(area, true);

    const handleDownloadImages = async () => {
      setIsDownloading(true);
      downloadImages()
        .then(() => toast.success("Imágenes descargadas satisfactoriamente"))
        .catch((error: unknown) => {
          toast.error("Error al descargar las imágenes");
          console.error("Error al descargar las imágenes:", error);
        })
        .finally(() => setIsDownloading(false));
    };

    return (
      <LoadingButton
        ref={ref}
        variant={withLabel ? "ghost" : "default"}
        onClick={handleDownloadImages}
        loading={isDownloading}
        size={withLabel ? "sm" : "icon"}
        title={title}
        icon={<FileImageIcon className="w-4 h-4" />}
        className={className}
      >
        {withLabel && <span>{title}</span>}
      </LoadingButton>
    );
  }
);
