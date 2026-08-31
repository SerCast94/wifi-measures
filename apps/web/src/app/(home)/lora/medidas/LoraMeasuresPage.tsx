import { toast } from "sonner";
import { RadioTowerIcon } from "lucide-react";

import CustomLoading from "@/core/components/CustomLoading";
import { CsvUploadButton } from "@/features/lora/components/CsvUploadButton";
import { LoraMeasuresTable } from "@/features/lora/components/LoraMeasuresTable";
import {
  useCreateLoraMeasures,
  useDeleteLoraMeasure,
  useLoraMeasures,
} from "@/features/lora/hooks/use-lora";
import { parseLoraMeasuresCsv } from "@/features/lora/lib/csv";

const LoraMeasuresPage = () => {
  const { data: measures, isLoading } = useLoraMeasures();
  const createMeasures = useCreateLoraMeasures();
  const deleteMeasure = useDeleteLoraMeasure();

  const handleParsed = async (text: string, fileName: string) => {
    const records = parseLoraMeasuresCsv(text);
    if (records.length === 0) {
      toast.error(
        `No se encontraron bloques válidos en «${fileName}». Revisa el formato del CSV.`
      );
      return;
    }
    const blocks = records.reduce((n, r) => n + (r.blocks?.length ?? 0), 0);
    try {
      await createMeasures.mutateAsync(records);
      toast.success(
        `Se cargó «${fileName}» con ${blocks} bloques (${records.length} medida).`
      );
    } catch {
      // error gestionado globalmente
    }
  };

  return (
    <div className="w-full px-2 py-2 mx-auto mb-4 sm:px-10 sm:py-6 xl:px-16 xl:py-8 animate-in fade-in-0">
      <div className="flex flex-col items-center justify-between gap-2 mt-2 mb-4 sm:flex-row">
        <h1 className="flex gap-4 px-2 mb-2 text-lg font-bold sm:items-center sm:text-2xl">
          <RadioTowerIcon className="w-6 h-6" />
          Medidas LoRa
        </h1>
        <CsvUploadButton
          onParsed={handleParsed}
          disabled={createMeasures.isPending}
        />
      </div>

      {isLoading ? (
        <CustomLoading />
      ) : (
        <LoraMeasuresTable
          measures={measures}
          onDelete={(id) => {
            if (window.confirm(`¿Eliminar la medida #${id}?`)) {
              deleteMeasure.mutate(id);
            }
          }}
          deleting={deleteMeasure.isPending}
        />
      )}
    </div>
  );
};

export default LoraMeasuresPage;
