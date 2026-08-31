import { toast } from "sonner";
import { AudioWaveformIcon } from "lucide-react";

import CustomLoading from "@/core/components/CustomLoading";
import { CsvUploadButton } from "@/features/lora/components/CsvUploadButton";
import { LoraNoiseTable } from "@/features/lora/components/LoraNoiseTable";
import {
  useCreateLoraNoise,
  useDeleteLoraNoise,
  useLoraNoise,
} from "@/features/lora/hooks/use-lora";
import { parseLoraNoiseCsv } from "@/features/lora/lib/csv";

const LoraNoisePage = () => {
  const { data: noise, isLoading } = useLoraNoise();
  const createNoise = useCreateLoraNoise();
  const deleteNoise = useDeleteLoraNoise();

  const handleParsed = async (text: string, fileName: string) => {
    const records = parseLoraNoiseCsv(text);
    if (records.length === 0) {
      toast.error(
        `No se encontraron frecuencias válidas en «${fileName}». Revisa el formato del CSV.`
      );
      return;
    }
    const entries = records.reduce((n, r) => n + (r.entries?.length ?? 0), 0);
    try {
      await createNoise.mutateAsync(records);
      toast.success(
        `Se cargó «${fileName}» con ${entries} frecuencias (${records.length} registro de ruido).`
      );
    } catch {
      // error gestionado globalmente
    }
  };

  return (
    <div className="w-full px-2 py-2 mx-auto mb-4 sm:px-10 sm:py-6 xl:px-16 xl:py-8 animate-in fade-in-0">
      <div className="flex flex-col items-center justify-between gap-2 mt-2 mb-4 sm:flex-row">
        <h1 className="flex gap-4 px-2 mb-2 text-lg font-bold sm:items-center sm:text-2xl">
          <AudioWaveformIcon className="w-6 h-6" />
          Ruido
        </h1>
        <CsvUploadButton
          label="Cargar CSV"
          onParsed={handleParsed}
          disabled={createNoise.isPending}
        />
      </div>

      {isLoading ? (
        <CustomLoading />
      ) : (
        <LoraNoiseTable
          noise={noise}
          onDelete={(id) => {
            if (window.confirm(`¿Eliminar el registro de ruido #${id}?`)) {
              deleteNoise.mutate(id);
            }
          }}
          deleting={deleteNoise.isPending}
        />
      )}
    </div>
  );
};

export default LoraNoisePage;
