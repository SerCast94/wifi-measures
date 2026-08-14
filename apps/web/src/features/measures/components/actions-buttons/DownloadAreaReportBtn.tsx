import { forwardRef, useState } from "react";

import { toast } from "sonner";
import { FileDownIcon } from "lucide-react";

import type { Area } from "../../types/areas.types";
import { LoadingButton } from "@/core/atomic-components/loading-button";
import { useAreaReport } from "../../hooks/use-area-report";

interface DownloadAreaReportBtnProps {
  area: Area;
  className?: string;
  withLabel?: boolean;
  title?: string;
}

export const DownloadAreaReportBtn = forwardRef<
  HTMLButtonElement,
  DownloadAreaReportBtnProps
>(
  (
    { area, className, withLabel = false, title = "Descargar Informe" },
    ref
  ) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const { downloadReport } = useAreaReport(area);

    const handleDownloadReport = async () => {
      setIsDownloading(true);
      downloadReport()
        .then(() => toast.success("Informe descargado satisfactoriamente"))
        .catch((error: unknown) => {
          toast.error("Error al descargar el informe");
          console.error("Error al descargar el informe:", error);
        })
        .finally(() => setIsDownloading(false));
    };

    return (
      <LoadingButton
        ref={ref}
        variant={withLabel ? "ghost" : "default"}
        onClick={handleDownloadReport}
        loading={isDownloading}
        size={withLabel ? "sm" : "icon"}
        title={title}
        icon={<FileDownIcon className="w-4 h-4" />}
        className={className}
      >
        {withLabel && <span>{title}</span>}
      </LoadingButton>
    );
  }
);
