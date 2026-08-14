import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, ChevronLeftIcon, Clock, Info } from "lucide-react";

import { Button } from "@/core/atomic-components/button";
import { useBackNavigation } from "@/core/hooks/useBackNavigation";
import type { MeasureModel } from "@/features/measures/models/measure.model";
import { DownloadMeasureImagesBtn } from "@/features/measures/components/actions-buttons/DownloadMeasureImagesBtn";
import { AllCardsCollapsableChannels } from "@/features/measures/components/actions-buttons/AllCardsCollapsableChannels";

interface MeasureHeaderProps {
  measure: MeasureModel;
  activeTab: string;
}

export const MeasureHeader = ({ measure, activeTab }: MeasureHeaderProps) => {
  const goBack = useBackNavigation();

  return (
    <div className="flex flex-col gap-6 px-2">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-transparent hover:opacity-70"
              onClick={goBack}
            >
              <ChevronLeftIcon size={200} />
            </Button>
            <h1 className="text-xl font-bold sm:text-2xl">
              {`${measure.metadata["AREA_GEOGR"]} - P${measure.metadata["PTO_MEDIDA"]}M${measure.metadata["N_MEDIDA"]}`}
            </h1>
          </div>
          <div className="flex gap-2">
            <AllCardsCollapsableChannels activeTab={activeTab} />
            <DownloadMeasureImagesBtn
              className="text-white bg-green-800"
              measure={measure}
            />
          </div>
        </div>

        <div className="flex gap-2 px-4 sm:items-center text-muted-foreground">
          <span className="font-bold">Medida Wi‑Fi</span>
          <div className="flex items-center">
            <Calendar className="w-4 h-4 mr-1" />
            <span>
              Creado: {format(measure.datetime, "dd MMMM yyyy", { locale: es })}{" "}
              <span className="inline sm:hidden">
                {format(measure.datetime, "HH:mm", { locale: es })}
              </span>
            </span>
          </div>
          <span className="hidden sm:inline">•</span>
          <div className="items-center hidden sm:flex">
            <Clock className="w-4 h-4 mr-1" />
            <span>
              Hora: {format(measure.datetime, "HH:mm", { locale: es })}
            </span>
          </div>
          <span className="hidden sm:inline">•</span>
          <div className="items-center hidden sm:flex">
            <Info className="w-4 h-4 mr-1" />
            <span className="font-mono text-xs">{measure.idFormulario}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
