import { toast } from "sonner";

import { parseLoraMeasuresCsv, parseLoraNoiseCsv } from "../lib/csv";
import { useCreateLoraMeasures, useCreateLoraNoise } from "../hooks/use-lora";
import type { LoraMeasure, LoraNoise } from "../types/lora.types";
import { CsvUploadButton } from "./CsvUploadButton";

interface LoraCsvUploadButtonProps {
  kind: "measures" | "noise";
  label?: string;
  multiple?: boolean;
  disabled?: boolean;
  onCreated?: (created: LoraMeasure[] | LoraNoise[]) => void;
}

export const LoraCsvUploadButton = ({
  kind,
  label,
  multiple = false,
  disabled,
  onCreated,
}: LoraCsvUploadButtonProps) => {
  const createMeasures = useCreateLoraMeasures();
  const createNoise = useCreateLoraNoise();
  const isPending =
    kind === "measures" ? createMeasures.isPending : createNoise.isPending;

  const handleParsed = async (text: string, fileName: string) => {
    if (kind === "measures") {
      const records = parseLoraMeasuresCsv(text);
      if (records.length === 0) {
        toast.error(
          `No se encontraron bloques válidos en «${fileName}». Revisa el formato del CSV.`
        );
        return;
      }
      const blocks = records.reduce(
        (sum, record) => sum + (record.blocks?.length ?? 0),
        0
      );
      try {
        const created = await createMeasures.mutateAsync(records);
        toast.success(
          `Se cargó «${fileName}» con ${blocks} bloques (${records.length} ${
            records.length === 1 ? "medida" : "medidas"
          }).`
        );
        onCreated?.(created);
      } catch {
        // error gestionado globalmente
      }
      return;
    }

    const records = parseLoraNoiseCsv(text);
    if (records.length === 0) {
      toast.error(
        `No se encontraron frecuencias válidas en «${fileName}». Revisa el formato del CSV.`
      );
      return;
    }
    const entries = records.reduce(
      (sum, record) => sum + (record.entries?.length ?? 0),
      0
    );
    try {
      const created = await createNoise.mutateAsync(records);
      toast.success(
        `Se cargó «${fileName}» con ${entries} frecuencias (${records.length} registro de ruido).`
      );
      onCreated?.(created);
    } catch {
      // error gestionado globalmente
    }
  };

  return (
    <CsvUploadButton
      label={label}
      onParsed={handleParsed}
      disabled={disabled ?? isPending}
      multiple={multiple}
    />
  );
};