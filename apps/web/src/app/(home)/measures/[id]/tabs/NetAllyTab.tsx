import { useState } from "react";

import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Clock,
  Cpu,
  FileText,
  Link2,
  Wifi,
} from "lucide-react";

import { Card, CardContent } from "@/core/atomic-components/card";
import { cn } from "@/core/lib/utils";
import type { MeasureModel } from "@/features/measures/models/measure.model";

interface NetAllyTabProps {
  measure: MeasureModel;
}

const NETALLY_COLORS: Record<string, { dot: string; text: string; bg: string }> = {
  red: {
    dot: "bg-red-500",
    text: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/40",
  },
  yellow: {
    dot: "bg-yellow-400",
    text: "text-yellow-600",
    bg: "bg-yellow-50 dark:bg-yellow-950/40",
  },
  green: {
    dot: "bg-green-500",
    text: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/40",
  },
  black: {
    dot: "bg-gray-400",
    text: "text-gray-500",
    bg: "bg-gray-100 dark:bg-gray-900/40",
  },
};

const COLOR_LABELS: Record<string, string> = {
  red: "Fallido",
  yellow: "Con advertencias",
  green: "Correcto",
  black: "Sin datos",
};

const val = (value: unknown): string => {
  if (value === null || value === undefined || value === "") return "—";
  if (value === "--") return "—";
  if (typeof value === "object") return JSON.stringify(value);
  return `${value}`;
};

type RawMeasure = Record<string, unknown>;

const Field = ({ label, value }: { label: string; value: unknown }) => (
  <div className="space-y-0.5">
    <p className="text-xs font-medium text-muted-foreground">{label}</p>
    <p className="text-sm break-words">{val(value)}</p>
  </div>
);

interface SectionProps {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const Section = ({
  icon,
  title,
  children,
  defaultOpen = false,
}: SectionProps) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-accent/50"
      >
        <span className="flex items-center gap-2 text-sm font-semibold">
          {icon}
          {title}
        </span>
        <ChevronDown
          className={cn(
            "w-4 h-4 shrink-0 text-muted-foreground transition-transform duration-200",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="grid grid-cols-1 gap-3 border-t px-4 py-4 sm:grid-cols-2 lg:grid-cols-3">
          {children}
        </div>
      )}
    </div>
  );
};

interface MetricCardProps {
  label: string;
  value: unknown;
  color?: unknown;
}

const METRIC_COLOR_CLASSES: Record<string, string> = {
  red: "text-red-600 border-red-200 bg-red-50 dark:bg-red-950/40 dark:border-red-900",
  yellow:
    "text-yellow-600 border-yellow-200 bg-yellow-50 dark:bg-yellow-950/40 dark:border-yellow-900",
  green:
    "text-green-600 border-green-200 bg-green-50 dark:bg-green-950/40 dark:border-green-900",
  black: "text-muted-foreground border-border bg-muted/40",
};

const MetricCard = ({ label, value, color }: MetricCardProps) => {
  const numeric = val(value);
  if (numeric === "—") {
    return (
      <div className="rounded-lg border p-3 bg-muted/40">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="mt-1 text-lg font-semibold text-muted-foreground">—</p>
      </div>
    );
  }
  const colorKey = `${color ?? ""}`;
  const classes =
    METRIC_COLOR_CLASSES[colorKey] ??
    "text-foreground border-border bg-card";
  return (
    <div className={cn("rounded-lg border p-3", classes)}>
      <p className="text-xs opacity-80">{label}</p>
      <p className="mt-1 text-lg font-semibold">{numeric}</p>
    </div>
  );
};

export const NetAllyTab = ({ measure }: NetAllyTabProps) => {
  const raw = measure.raw as RawMeasure | null;

  if (!raw) {
    return (
      <Card>
        <CardContent className="mt-4 text-sm text-muted-foreground">
          Esta medida no contiene datos de NetAlly Link-Live.
        </CardContent>
      </Card>
    );
  }

  const meta = (raw.meta ?? {}) as RawMeasure;
  const color = `${raw.overallColor ?? ""}`;
  const linkColor = `${raw.linkColor ?? ""}`;
  const colorMeta = NETALLY_COLORS[color] ?? NETALLY_COLORS.black;
  const failures = [
    ...((raw.linkFailureReasons ?? []) as unknown[]),
    ...((raw.failureReasons ?? []) as unknown[]),
  ].map(String);
  const isOk = color === "green";

  return (
    <div className="space-y-4">
      {/* Resumen del resultado */}
      <Card>
        <CardContent
          className={cn("mt-4 flex flex-col gap-4 sm:flex-row sm:items-center", colorMeta.bg)}
        >
          <div className="flex items-center gap-3">
            {isOk ? (
              <CheckCircle2 className={cn("w-10 h-10", colorMeta.text)} />
            ) : (
              <AlertTriangle className={cn("w-10 h-10", colorMeta.text)} />
            )}
            <div>
              <p className={cn("text-2xl font-bold capitalize", colorMeta.text)}>
                {COLOR_LABELS[color] ?? (color || "Sin datos")}
              </p>
              <p className="text-sm text-muted-foreground">
                Perfil: {val(raw.profileName)} · Tipo: {val(raw.resultType)}
              </p>
            </div>
          </div>

          {failures.length > 0 && (
            <div className="flex flex-1 items-start gap-2 rounded-md border border-red-200 bg-white/70 p-3 dark:bg-background/70">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-600" />
              <ul className="list-inside list-disc space-y-0.5 text-sm text-red-700 dark:text-red-400">
                {failures.map((failure) => (
                  <li key={failure}>{failure}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Métricas principales del enlace */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <MetricCard
          label="Señal media (dBm)"
          value={raw.linkSignalLevelMean}
          color={raw.linkSignalLevelMeanColor}
        />
        <MetricCard
          label="SNR media (dB)"
          value={raw.linkSNRMean}
          color={raw.linkSNRMeanColor}
        />
        <MetricCard
          label="Ruido medio (dBm)"
          value={raw.linkNoiseLevelMean}
        />
        <MetricCard
          label="Velocidad física"
          value={raw.linkPhyDataRate}
        />
        <MetricCard
          label="% vel. máxima"
          value={raw.linkPhyPctOfMaxDataRateMean}
          color={raw.linkPhyPctOfMaxDataRateMeanColor}
        />
        <MetricCard
          label="Reintentos (%)"
          value={raw.linkRetryRateMean}
          color={raw.linkRetryRateMeanColor}
        />
      </div>

      {/* Detalle por secciones */}
      <Card>
        <CardContent className="mt-4 space-y-3">
          <Section icon={<Link2 className="w-4 h-4" />} title="Enlace" defaultOpen>
            <Field label="Nivel de señal medio (dBm)" value={raw.linkSignalLevelMean} />
            <Field label="SNR media (dB)" value={raw.linkSNRMean} />
            <Field label="Ruido medio (dBm)" value={raw.linkNoiseLevelMean} />
            <Field label="Velocidad física" value={raw.linkPhyDataRate} />
            <Field label="% de la velocidad máxima" value={raw.linkPhyPctOfMaxDataRateMean} />
            <Field label="Tasa de reintentos" value={raw.linkRetryRateMean} />
            <Field label="Color del enlace" value={linkColor} />
          </Section>

          <Section icon={<Wifi className="w-4 h-4" />} title="Red">
            <Field label="Perfil" value={raw.profileName} />
            <Field label="Identificador de resultado" value={meta.resultIdentifier} />
            <Field label="IP de gestión Wi-Fi" value={raw.ipWifiManagement} />
            <Field label="IP de gestión cableada" value={raw.ipWiredManagement} />
            <Field label="SSID conectado" value={raw.ssid} />
            <Field label="Canal" value={raw.channel} />
          </Section>

          <Section icon={<Cpu className="w-4 h-4" />} title="Unidad">
            <Field label="Nombre" value={raw.unit_name} />
            <Field label="Tipo" value={raw.unit_type} />
            <Field label="MAC" value={raw.unit_mac} />
            <Field label="Nº de serie" value={raw.unit_serial} />
            <Field label="Versión de firmware" value={raw.unit_firmwareVersion} />
          </Section>

          <Section icon={<Clock className="w-4 h-4" />} title="Fechas">
            <Field label="Creada" value={raw.created_at} />
            <Field label="Subida" value={raw.uploaded_at} />
            <Field label="Actualizada" value={raw.updated_at} />
            <Field
              label="Fecha de medición"
              value={meta.date ? `${meta.date} ${meta.time ?? ""}`.trim() : null}
            />
          </Section>

          <Section icon={<Activity className="w-4 h-4" />} title="Sesión">
            <Field label="Inalámbrico" value={meta.isWireless} />
            <Field label="Ethernet" value={meta.isEthernet} />
            <Field label="Sesión" value={meta.isSession} />
            <Field label="Resumen de sesión" value={meta.sessionSummary} />
            <Field label="Con imágenes" value={meta.hasImages} />
            <Field
              label="Etiquetas"
              value={((raw.labels ?? []) as unknown[]).join(", ")}
            />
          </Section>

          <Section icon={<FileText className="w-4 h-4" />} title="Identificadores">
            <Field label="ID de resultado" value={raw._id} />
            <Field label="GUID" value={raw.guid} />
            <Field label="GUID de auto-test" value={raw.autoTestGuid} />
            <Field label="ID de unidad" value={raw.unit_id} />
            <Field label="Organización" value={raw.organizationId} />
          </Section>
        </CardContent>
      </Card>
    </div>
  );
};
