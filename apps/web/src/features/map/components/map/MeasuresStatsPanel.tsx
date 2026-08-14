import { memo } from "react";

import { InfoIcon } from "lucide-react";

import CollapsablePanel from "@/core/components/CollapsablePanel";
import { useMeasuresStore } from "@/features/measures/store/measures.store";

export const MeasuresStatsPanel = memo(() => {
  const measuresLength = useMeasuresStore((state) => state.measuresIds.length);
  const filteredMeasuresLength = useMeasuresStore(
    (state) => state.measuresIds.length
  );
  // const filteredMeasuresLength = useMeasuresStore(
  //   (state) => state.filteredMeasuresIds.length
  // );

  if (measuresLength === 0) return null;

  return (
    <CollapsablePanel
      icon={InfoIcon}
      title="Estadísticas de medidas"
      hideOnlyContent={false}
      className="bg-blue-200 text-blue-900 border-blue-300 !bg-opacity-60 pointer-events-auto"
      defaultMinimized
    >
      <div className="flex flex-col gap-2 p-4 pt-0 text-xs">
        <div className="flex flex-row items-center gap-2">
          <span className="font-medium">Medidas totales:</span>
          <span className="font-semibold">{measuresLength}</span>
        </div>
        {measuresLength !== filteredMeasuresLength && (
          <div className="flex flex-row items-center gap-2">
            <span className="font-medium">Medidas filtradas:</span>
            <span className="font-semibold">{filteredMeasuresLength}</span>
          </div>
        )}
      </div>
    </CollapsablePanel>
  );
});
