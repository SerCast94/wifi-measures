import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar, Clock } from "lucide-react";

import { Separator } from "@/core/atomic-components/separator";
import { Card, CardContent } from "@/core/atomic-components/card";
import type { MeasureModel } from "@/features/measures/models/measure.model";

interface GeneralTabProps {
  measure: MeasureModel;
}

const NETALLY_COLORS: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-yellow-400",
  green: "bg-green-500",
  black: "bg-gray-400",
};

const val = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—";
  if (value === "--") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return `${value}`;
};

const Field = ({ label, value }: { label: string; value: unknown }) => (
  <div className="space-y-0.5">
    <p className="text-sm font-medium">{label}</p>
    <p className="text-sm break-words text-muted-foreground">{val(value)}</p>
  </div>
);

const StatusBadge = ({ color }: { color: string }) => (
  <div className="flex items-center gap-2">
    <span
      className={`inline-block w-3.5 h-3.5 rounded-full ${
        NETALLY_COLORS[color] ?? "bg-gray-300"
      }`}
    />
    <p className="text-base capitalize">{color || "—"}</p>
  </div>
);

export const GeneralTab = ({ measure }: GeneralTabProps) => {
  const raw = (measure.raw ?? {}) as Record<string, unknown>;

  return (
    <Card>
      <CardContent className="flex flex-col gap-4 mt-4 space-y-4 md:flex-row md:space-y-0">
        <div className="flex flex-col flex-1 gap-2">
          <div className="space-y-1">
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
            <Field label="Unidad" value={raw.unit_name} />
            <Field label="Tipo de unidad" value={raw.unit_type} />
            <Field label="Nº de serie" value={raw.unit_serial} />
            <Field label="Perfil de prueba" value={raw.profileName} />
          </div>
          <Separator />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Tipo de resultado" value={raw.resultType} />
            <Field label="Estado general" value={raw.overallColor} />
          </div>
        </div>

        <div className="flex flex-col flex-1 gap-4 md:gap-6">
          <div className="space-y-2">
            <p className="text-sm font-medium">Estado del enlace</p>
            <StatusBadge color={val(raw.linkColor)} />
          </div>
          <Separator />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Señal media (dBm)" value={raw.linkSignalLevelMean} />
            <Field label="SNR media (dB)" value={raw.linkSNRMean} />
            <Field label="Ruido medio (dBm)" value={raw.linkNoiseLevelMean} />
            <Field label="Velocidad física" value={raw.linkPhyDataRate} />
            <Field
              label="% de la velocidad máxima"
              value={raw.linkPhyPctOfMaxDataRateMean}
            />
            <Field label="Tasa de reintentos" value={raw.linkRetryRateMean} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};