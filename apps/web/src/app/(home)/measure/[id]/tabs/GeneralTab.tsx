import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock } from "lucide-react";

import { Separator } from "@/core/atomic-components/separator";
import { Card, CardContent } from "@/core/atomic-components/card";
import type { MeasureModel } from "@/features/measures/models/measure.model";
import MinimapWrapper from "@/features/map/components/minimap/MinimapWrapper";
import MeasureImageViewer from "@/features/measures/components/image-viewer/AntenaImageViewer";

interface GeneralTabProps {
  measure: MeasureModel;
}

export const GeneralTab = ({ measure }: GeneralTabProps) => {
  return (
    <Card>
      <CardContent className="flex gap-4 mt-4 space-y-4 md:space-y-0">
        <div className="flex flex-col flex-1 gap-2">
          <div className="grid grid-cols-1">
            <p className="text-sm font-medium">Fecha de Medida</p>
            <div className="space-y-1">
              <div className="flex items-center">
                <Calendar className="w-5 h-5 mr-2 text-primary" />
                <p className="text-base">
                  {measure.datetime
                    ? format(measure.datetime, "EEEE, dd 'de' MMMM 'de' yyyy", {
                        locale: es,
                      })
                    : "Sin fecha especificada"}
                </p>
              </div>
              <div className="flex items-center ml-7">
                <Clock className="w-5 h-5 mr-2 text-primary" />
                <p className="text-base">
                  {format(measure.datetime, "HH:mm", { locale: es })} horas
                </p>
              </div>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">Área geográfica</p>
              <p className="text-base">{`${measure.metadata["ID_AREA"]} - ${measure.metadata["AREA_GEOGR"]}`}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Provincia</p>
              <p className="text-base">{measure.metadata["PROVINCIA"]}</p>
            </div>
          </div>
          <Separator />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="space-y-1">
              <p className="text-sm font-medium">Punto de Medida</p>
              <p className="text-base">{`P${measure.metadata["PTO_MEDIDA"]}`}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium">Nº Medida</p>
              <p className="text-base">{`M${measure.metadata["N_MEDIDA"]}`}</p>
            </div>
          </div>
          <Separator />

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <p className="text-sm font-medium">Foto Antena</p>
              <MeasureImageViewer
                measureId={`${measure.id}`}
                alt="Foto Antena"
                className="w-full aspect-video"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col flex-1 gap-4 md:gap-6">
          <div className="grid grid-cols-1">
            <div className="space-y-2">
              <p className="text-sm font-medium">Coordenadas</p>
              <p className="text-base">{`${measure.latitude}, ${measure.longitude}`}</p>
            </div>
          </div>
          <div className="w-full overflow-hidden rounded-2xl h-[435px]">
            <MinimapWrapper measureId={`${measure.id}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
