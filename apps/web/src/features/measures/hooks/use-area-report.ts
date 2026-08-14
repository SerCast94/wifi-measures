import { useState } from "react";

import { toast } from "sonner";
import { saveAs } from "file-saver";

import type { Area } from "../types/areas.types";
import { useAreaReportImages } from "./use-area-report-images";
import { createAreaMedidasReport } from "../lib/reports.helper";

export const useAreaReport = (area: Area) => {
  const { fetchImages } = useAreaReportImages(`${area.id}`);
  const [isGettingReport, setIsGettingReport] = useState(false);

  const getReport = async () => {
    setIsGettingReport(true);
    try {
      const images = await fetchImages();

      return createAreaMedidasReport(area, images);
    } catch (error) {
      console.error(
        `Error generando el informe del envío para el centro ${area.name}:`,
        error
      );
      toast.error(
        `Error generando el informe del envío para el centro ${area.name}`
      );
    } finally {
      setIsGettingReport(false);
    }
  };

  const downloadReport = async () => {
    const report = await getReport();
    if (!report) throw new Error("No se pudo generar el informe");
    saveAs(report, `${area.id}_${area.name}.docx`);
  };

  return { downloadReport, isGettingReport, getReport };
};
