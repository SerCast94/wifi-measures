import { forwardRef, useState } from "react";

import { toast } from "sonner";
import { FileImageIcon } from "lucide-react";

import type { MeasureModel } from "../../models/measure.model";
import { LoadingButton } from "@/core/atomic-components/loading-button";
import { useDownloadMeasureImages } from "../../hooks/use-download-measure-images";

interface DownloadMeasureImagesBtnProps {
  measure: MeasureModel;
  className?: string;
  withLabel?: boolean;
  title?: string;
}

export const DownloadMeasureImagesBtn = forwardRef<
  HTMLButtonElement,
  DownloadMeasureImagesBtnProps
>(
  (
    { measure, className, withLabel = false, title = "Descargar Imágenes" },
    ref
  ) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const { downloadImages } = useDownloadMeasureImages(measure, true);

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
