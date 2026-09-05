import { RadioTowerIcon } from "lucide-react";

import CustomLoading from "@/core/components/CustomLoading";
import { Badge } from "@/core/atomic-components/badge";
import { LoraCsvUploadButton } from "@/features/lora/components/LoraCsvUploadButton";
import { LoraMeasuresTable } from "@/features/lora/components/LoraMeasuresTable";
import {
  useDeleteLoraMeasure,
  useLoraMeasures,
} from "@/features/lora/hooks/use-lora";

const LoraMeasuresPage = () => {
  const { data: measures, isLoading } = useLoraMeasures();
  const deleteMeasure = useDeleteLoraMeasure();

  return (
    <div className="w-full px-2 py-2 mx-auto mb-4 sm:px-10 sm:py-6 xl:px-16 xl:py-8 animate-in fade-in-0">
      <div className="flex flex-col items-center justify-between gap-2 mt-2 mb-4 sm:flex-row">
        <h1 className="flex items-center gap-3 px-2 mb-2 text-lg font-bold sm:text-2xl">
          <RadioTowerIcon className="w-6 h-6" />
          Medidas LoRa
          {!isLoading && measures ? (
            <Badge variant="secondary">{measures.length}</Badge>
          ) : null}
        </h1>
        <LoraCsvUploadButton
          kind="measures"
          label="Cargar CSV"
          multiple
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
