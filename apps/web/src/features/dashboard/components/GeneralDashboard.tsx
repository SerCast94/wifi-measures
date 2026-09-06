import { Link } from "react-router";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  ClipboardListIcon,
  CircleHelp,
  FolderCheckIcon,
  ListChecksIcon,
  RadioTowerIcon,
  RocketIcon,
  XCircle,
} from "lucide-react";

import { Badge } from "@/core/atomic-components/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/atomic-components/card";
import { Progress } from "@/core/atomic-components/progress";
import { AuditStatusBadge } from "@/features/audits/components/badges";
import { useAuditsStats } from "@/features/audits/hooks/use-audits";
import { AUDIT_STATUS_LABELS } from "@/features/audits/types/audit.types";
import type { AuditStatus } from "@/features/audits/types/audit.types";
import { useLoraStats } from "@/features/lora/hooks/use-lora";
import {
  LORA_AUDIT_STATUS_LABELS,
  LORA_GLOBAL_RESULT_LABELS,
} from "@/features/lora/types/lora.types";

const STATUS_ORDER = [
  "BORRADOR",
  "EN_PROGRESO",
  "COMPLETADA",
  "PENDIENTE_DE_REVISION",
  "INFORME_GENERADO",
  "ARCHIVADA",
] as const;

const GLOBAL_RESULT_ORDER = [
  "APROBADO",
  "APROBADO_CON_OBSERVACIONES",
  "NO_CONFORME",
  "SIN_DATOS_SUFICIENTES",
] as const;

const GLOBAL_RESULT_STYLES: Record<string, string> = {
  APROBADO: "bg-green-600",
  APROBADO_CON_OBSERVACIONES: "bg-amber-500",
  NO_CONFORME: "bg-red-600",
  SIN_DATOS_SUFICIENTES: "bg-slate-400",
};

const TechBadge = ({ tech }: { tech: "wifi" | "lora" }) => (
  <Badge
    variant="outline"
    className={
      tech === "wifi"
        ? "border-sky-200 bg-sky-50 text-sky-800"
        : "border-violet-200 bg-violet-50 text-violet-800"
    }
  >
    {tech === "wifi" ? "Wi-Fi" : "LoRa"}
  </Badge>
);

const KpiCard = ({
  label,
  value,
  hint,
  to,
}: {
  label: string;
  value: string | number;
  hint?: string;
  to?: string;
}) => {
  const content = (
    <CardContent className="p-4">
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      {hint ? (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </CardContent>
  );
  return (
    <Card className="transition-shadow hover:shadow-md">
      {to ? (
        <Link to={to} className="block h-full">
          {content}
        </Link>
      ) : (
        content
      )}
    </Card>
  );
};

const StatusBars = ({
  footerTo,
  byStatus,
  labels,
  tech,
}: {
  footerTo: string;
  byStatus: Record<string, number>;
  labels: Record<string, string>;
  tech: "wifi" | "lora";
}) => {
  const total = Object.values(byStatus).reduce<number>((a, b) => a + b, 0);
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between gap-2 text-base">
          <span className="flex items-center gap-2">
            {tech === "wifi" ? (
              <RadioTowerIcon className="h-4 w-4" />
            ) : (
              <Activity className="h-4 w-4" />
            )}
            Estado {tech === "wifi" ? "Wi-Fi" : "LoRa"}
          </span>
          <TechBadge tech={tech} />
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {total === 0 ? (
          <p className="text-sm text-muted-foreground">
            No hay auditorías {tech === "wifi" ? "Wi-Fi" : "LoRa"} todavía.
          </p>
        ) : (
          STATUS_ORDER.map((status) => {
            const count = byStatus[status] ?? 0;
            if (count === 0) return null;
            return (
              <div key={status}>
                <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                  <span>{labels[status] ?? status}</span>
                  <span className="text-muted-foreground">{count}</span>
                </div>
                <Progress value={(count / total) * 100} />
              </div>
            );
          })
        )}
        <Link
          to={footerTo}
          className="inline-block text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          Ver todas →
        </Link>
      </CardContent>
    </Card>
  );
};

const AlertRow = ({
  icon,
  className,
  text,
}: {
  icon: React.ReactNode;
  className: string;
  text: string;
}) => (
  <div
    className={`flex items-start gap-2 rounded-md border px-3 py-2 text-sm ${className}`}
  >
    {icon}
    <span>{text}</span>
  </div>
);

const GeneralDashboard = () => {
  const { data: wifi } = useAuditsStats();
  const { data: lora } = useLoraStats();

  if (!wifi || !lora) return null;

  const wifiEvaluations = wifi.totals.evaluations;
  const loraEvaluations = lora.totals.evaluations;

  const globalResults = GLOBAL_RESULT_ORDER.map((key) => ({
    key,
    count: (wifi.globalResults[key] ?? 0) + (lora.globalResults[key] ?? 0),
  }));
  const globalTotal = globalResults.reduce<number>((a, b) => a + b.count, 0);

  const enProgresoWifi = wifi.byStatus["EN_PROGRESO"] ?? 0;
  const enProgresoLora = lora.byStatus["EN_PROGRESO"] ?? 0;
  const concluidas = (key: Record<string, number>) =>
    (key["COMPLETADA"] ?? 0) +
    (key["INFORME_GENERADO"] ?? 0) +
    (key["ARCHIVADA"] ?? 0);

  const recentRows: Array<{
    id: string;
    name: string;
    code: string | null;
    client: string | null;
    status: AuditStatus;
    createdAt: string;
    tech: "wifi" | "lora";
    link: string;
  }> = [
    ...wifi.recent.map((r) => ({
      ...r,
      tech: "wifi" as const,
      link: `/audits/${r.id}`,
    })),
    ...lora.recent.map((r) => ({
      ...r,
      tech: "lora" as const,
      link: `/lora/${r.id}`,
    })),
  ].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const alertas: Array<{
    icon: React.ReactNode;
    className: string;
    text: string;
  }> = [];
  if (wifi.totals.syncErrors > 0) {
    alertas.push({
      icon: <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />,
      className: "border-amber-300 bg-amber-50/50 text-amber-900",
      text: `Wi-Fi: ${wifi.totals.syncErrors} sincronización(es) con errores en los últimos 7 días.`,
    });
  }
  if (lora.totals.auditsWithoutData > 0) {
    alertas.push({
      icon: <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />,
      className: "border-slate-300 bg-slate-50 text-slate-700",
      text: `LoRa: ${lora.totals.auditsWithoutData} auditoría(s) sin medidas ni ruido cargados.`,
    });
  }
  if (lora.totals.auditsWithoutPlan > 0) {
    alertas.push({
      icon: <CircleHelp className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />,
      className: "border-slate-300 bg-slate-50 text-slate-700",
      text: `LoRa: ${lora.totals.auditsWithoutPlan} auditoría(s) sin plano asociado.`,
    });
  }

  const evalRows = [
    { key: "PASS", label: "Conforme", count: wifiEvaluations.PASS + loraEvaluations.PASS, color: "text-green-600", icon: CheckCircle2 },
    { key: "WARNING", label: "En el límite", count: wifiEvaluations.WARNING + loraEvaluations.WARNING, color: "text-amber-600", icon: Activity },
    { key: "FAIL", label: "No conforme", count: wifiEvaluations.FAIL + loraEvaluations.FAIL, color: "text-red-600", icon: XCircle },
    { key: "UNKNOWN", label: "Sin datos", count: wifiEvaluations.UNKNOWN + loraEvaluations.UNKNOWN, color: "text-slate-400", icon: CircleHelp },
  ];
  const evalTotal = evalRows.reduce<number>((a, b) => a + b.count, 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        <KpiCard
          label="Auditorías Wi-Fi"
          value={wifi.totals.audits}
          hint="ver listado"
          to="/audits"
        />
        <KpiCard
          label="Auditorías LoRa"
          value={lora.totals.audits}
          hint="ver listado"
          to="/lora"
        />
        <KpiCard
          label="En curso"
          value={enProgresoWifi + enProgresoLora}
          hint="Wi-Fi + LoRa"
        />
        <KpiCard
          label="Concluidas"
          value={concluidas(wifi.byStatus) + concluidas(lora.byStatus)}
          hint="completadas, con informe o archivadas"
        />
        <KpiCard
          label="Criterios evaluados"
          value={evalTotal}
          hint={`${Math.round(
            evalTotal > 0
              ? ((wifiEvaluations.PASS + loraEvaluations.PASS) / evalTotal) * 100
              : 0
          )}% conformes`}
        />
        <KpiCard
          label="Incidencias abiertas"
          value={wifi.totals.openIssues}
          hint="Wi-Fi"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <StatusBars
          footerTo="/audits"
          byStatus={wifi.byStatus}
          labels={AUDIT_STATUS_LABELS}
          tech="wifi"
        />
        <StatusBars
          footerTo="/lora"
          byStatus={lora.byStatus}
          labels={LORA_AUDIT_STATUS_LABELS}
          tech="lora"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <FolderCheckIcon className="h-4 w-4" /> Resultado global de auditorías
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {globalTotal === 0 ? (
              <p className="text-sm text-muted-foreground">
                Todavía no hay conclusiones de Wi-Fi ni análisis de LoRa.
              </p>
            ) : (
              GLOBAL_RESULT_ORDER.map((key) => {
                const entry = globalResults.find((r) => r.key === key);
                const count = entry?.count ?? 0;
                if (count === 0) return null;
                return (
                  <div key={key}>
                    <div className="mb-1 flex items-center justify-between gap-2 text-sm">
                      <span>
                        {LORA_GLOBAL_RESULT_LABELS[key] ??
                          key.replace(/_/g, " ").toLowerCase()}
                      </span>
                      <span className="text-muted-foreground">{count}</span>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className={`h-full rounded-full ${GLOBAL_RESULT_STYLES[key]}`}
                        style={{ width: `${(count / globalTotal) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <ListChecksIcon className="h-4 w-4" /> Evaluación de criterios (Wi-Fi + LoRa)
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {evalRows.map((row) => {
              const Icon = row.icon;
              return (
                <div key={row.key} className="rounded-md border p-3">
                  <p className={`flex items-center gap-1 text-2xl font-bold ${row.color}`}>
                    <Icon className="h-5 w-5" /> {row.count}
                  </p>
                  <p className="text-sm text-muted-foreground">{row.label}</p>
                </div>
              );
            })}
            <p className="col-span-2 text-sm text-muted-foreground sm:col-span-4">
              {evalTotal === 0
                ? "Sin criterios evaluados todavía. Ejecuta «Evaluar criterios» en cada auditoría."
                : `${evalTotal} criterios valorados de forma agregada.`}
            </p>
          </CardContent>
        </Card>
      </div>

      {alertas.length > 0 ? (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-4 w-4" /> Avisos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {alertas.map((alerta, index) => (
              <AlertRow key={index} {...alerta} />
            ))}
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <ClipboardListIcon className="h-4 w-4" /> Auditorías recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recentRows.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aún no hay auditorías. Crea la primera en Auditorías Wi-Fi o LoRa.
            </p>
          ) : (
            <ul className="divide-y rounded-md border">
              {recentRows.map((audit) => (
                <li key={`${audit.tech}-${audit.id}`}>
                  <Link
                    to={audit.link}
                    className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-muted"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <TechBadge tech={audit.tech} />
                      <span className="min-w-0 truncate text-sm">{audit.name}</span>
                    </span>
                    <span className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
                      <AuditStatusBadge status={audit.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Link
              to="/audits/new"
              className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            >
              <RocketIcon className="h-4 w-4" /> Nueva auditoría Wi-Fi
            </Link>
            <Link
              to="/lora/medidas"
              className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            >
              <Activity className="h-4 w-4" /> Cargar medidas/ruido LoRa
            </Link>
            <Link
              to="/measures"
              className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm hover:bg-muted"
            >
              <RadioTowerIcon className="h-4 w-4" /> Medidas HiDrive/Link-Live
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default GeneralDashboard;