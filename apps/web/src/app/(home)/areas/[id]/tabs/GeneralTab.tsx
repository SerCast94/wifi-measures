import { useState } from "react";

import { cn } from "@/core/lib/utils";

import { Separator } from "@/core/atomic-components/separator";
import { Card, CardContent } from "@/core/atomic-components/card";
import type { Area } from "@/features/measures/types/areas.types";
import MinimapAreaWrapper from "@/features/map/components/minimap/MinimapAreaWrapper";
import { GoToMeasureBtn } from "@/features/measures/components/actions-buttons/GoToMeasureBtn";

interface GeneralTabProps {
  area: Area;
}

export const GeneralTab = ({ area }: GeneralTabProps) => {
  const [selectedMeasureId, setSelectedMeasureId] = useState<number | null>(
    null
  );

  const handleSelectMeasure = (measureId: number) => {
    if (selectedMeasureId === measureId) {
      setSelectedMeasureId(null);
    } else {
      setSelectedMeasureId(measureId);
    }
  };

  return (
    <Card>
      <CardContent className="flex gap-4 mt-4 space-y-4 md:space-y-0">
        <div className="flex flex-col flex-1 gap-2">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">Área geográfica</p>
              <p className="text-base">{`${area.id} - ${area.name}`}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Provincia</p>
              <p className="text-base">{area.provincia}</p>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 gap-4">
            {area.measures.length > 0 &&
              area.measures.map((measure, index) => (
                <div
                  className="flex items-center justify-between gap-4"
                  key={measure.id}
                >
                  <div
                    className={cn(
                      "flex-1 p-2 space-y-1 rounded-lg cursor-pointer hover:bg-primary hover:text-white",
                      selectedMeasureId === measure.id &&
                        "bg-primary text-white"
                    )}
                    onClick={() => handleSelectMeasure(measure.id)}
                  >
                    <p className="text-sm font-medium">Medida {index + 1}</p>
                    <p className="text-sm">{measure.name}</p>
                  </div>
                  <div>
                    <GoToMeasureBtn measureId={`${measure.id}`} />
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="flex flex-col flex-1 gap-4 md:gap-6">
          <div className="w-full overflow-hidden rounded-2xl h-[435px]">
            <MinimapAreaWrapper
              areaId={`${area.id}`}
              selectedMeasureId={selectedMeasureId}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
