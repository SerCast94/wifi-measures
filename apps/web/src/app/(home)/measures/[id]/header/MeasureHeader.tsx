import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Calendar,
  Clock,
  GlobeIcon,
  Info,
  Router,
} from "lucide-react";
import { Link } from "react-router";

import { Breadcrumbs } from "@/core/components/Breadcrumbs";
import type { MeasureModel } from "@/features/measures/models/measure.model";

interface MeasureHeaderProps {
  measure: MeasureModel;
}

export const MeasureHeader = ({ measure }: MeasureHeaderProps) => {
  const raw = measure.raw as Record<string, unknown> | null;
  const areaId = measure.metadata["ID_AREA"];
  const areaName = measure.metadata["AREA_GEOGR"];
  const unitName = raw ? `${raw.unit_name ?? ""}` : "";
  const title = measure.raw
    ? `${areaName} — ${measure.name}`
    : `${areaName} - P${measure.metadata["PTO_MEDIDA"]}M${measure.metadata["N_MEDIDA"]}`;

  return (
    <div className="flex flex-col gap-4 px-2">
      <div className="flex flex-col gap-2">
        <Breadcrumbs
          items={[{ label: "Medidas", to: "/measures" }, { label: title }]}
        />
        <h1 className="px-4 text-xl font-bold sm:text-2xl">{title}</h1>

        <div className="flex flex-wrap items-center gap-2 px-4 text-muted-foreground">
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
          {areaId && (
            <>
              <span className="hidden sm:inline">•</span>
              <Link
                to={`/areas/${areaId}`}
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                title="Ver área"
              >
                <GlobeIcon className="w-4 h-4" />
                {areaName}
              </Link>
            </>
          )}
          {unitName && (
            <>
              <span className="hidden sm:inline">•</span>
              <Link
                to={`/units?q=${encodeURIComponent(unitName)}`}
                className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                title="Ver unidad"
              >
                <Router className="w-4 h-4" />
                {unitName}
              </Link>
            </>
          )}
          <span className="hidden lg:inline">•</span>
          <div className="hidden items-center lg:flex">
            <Info className="w-4 h-4 mr-1" />
            <span className="font-mono text-xs">{measure.idFormulario}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
