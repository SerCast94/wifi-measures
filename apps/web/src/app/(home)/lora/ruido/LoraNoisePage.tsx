import { AudioWaveformIcon } from "lucide-react";

import CustomLoading from "@/core/components/CustomLoading";
import { Badge } from "@/core/atomic-components/badge";
import { LoraCsvUploadButton } from "@/features/lora/components/LoraCsvUploadButton";
import { LoraNoiseTable } from "@/features/lora/components/LoraNoiseTable";
import {
  useDeleteLoraNoise,
  useLoraNoise,
} from "@/features/lora/hooks/use-lora";

const LoraNoisePage = () => {
  const { data: noise, isLoading } = useLoraNoise();
  const deleteNoise = useDeleteLoraNoise();

  return (
    <div className="w-full px-2 py-2 mx-auto mb-4 sm:px-10 sm:py-6 xl:px-16 xl:py-8 animate-in fade-in-0">
      <div className="flex flex-col items-center justify-between gap-2 mt-2 mb-4 sm:flex-row">
        <h1 className="flex items-center gap-3 px-2 mb-2 text-lg font-bold sm:text-2xl">
          <AudioWaveformIcon className="w-6 h-6" />
          Ruido
          {!isLoading && noise ? (
            <Badge variant="secondary">{noise.length}</Badge>
          ) : null}
        </h1>
        <LoraCsvUploadButton
          kind="noise"
          label="Cargar CSV"
          multiple
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
