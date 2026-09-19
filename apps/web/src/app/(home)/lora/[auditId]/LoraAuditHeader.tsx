import { Link, useLocation, useParams } from "react-router";
import { FileTextIcon } from "lucide-react";

import { cn } from "@/core/lib/utils";
import { Button } from "@/core/atomic-components/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/atomic-components/select";
import { LoraAuditStatusBadge } from "@/features/lora/components/badges";
import { useLoraAudit, useUpdateLoraAuditStatus, useUpdateAuditResult } from "@/features/lora/hooks/use-lora";
import {
  LORA_AUDIT_STATUS_LABELS,
  LORA_AUDIT_RESULT_LABELS,
  type LoraAuditResult,
  type LoraAuditStatus,
} from "@/features/lora/types/lora.types";
import { loraReportPdfUrl } from "@/features/lora/api/lora-api";

const TABS = [
  { key: "", label: "Resumen" },
  { key: "analisis", label: "Análisis" },
];

const STATUS_OPTIONS: LoraAuditStatus[] = [
  "BORRADOR",
  "EN_PROGRESO",
  "COMPLETADA",
  "PENDIENTE_DE_REVISION",
  "INFORME_GENERADO",
  "ARCHIVADA",
];

const RESULT_OPTIONS: Array<{ value: LoraAuditResult | "SIN_RESULTADO"; label: string }> = [
  { value: "SIN_RESULTADO", label: "Sin resultado" },
  { value: "CONFORME", label: "Conforme" },
  { value: "CONFORME_CON_ANOTACIONES", label: "Conforme con anotaciones" },
  { value: "NO_CONFORME", label: "No conforme" },
];

const LoraAuditHeader = () => {
  const { auditId = "" } = useParams<{ auditId: string }>();
  const location = useLocation();
  const { data: audit } = useLoraAudit(auditId);
  const updateStatus = useUpdateLoraAuditStatus(auditId);
  const updateResult = useUpdateAuditResult(auditId);

  if (!audit) return null;

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold sm:text-2xl">{audit.name}</h1>
            <LoraAuditStatusBadge status={audit.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {[audit.code, audit.client, audit.location]
              .filter(Boolean)
              .join(" · ") || "Sin metadatos"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select
            value={audit.result ?? "SIN_RESULTADO"}
            onValueChange={(value) =>
              updateResult.mutate(
                value === "SIN_RESULTADO"
                  ? null
                  : (value as LoraAuditResult)
              )
            }
            disabled={updateResult.isPending}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Resultado" />
            </SelectTrigger>
            <SelectContent>
              {RESULT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.value === "SIN_RESULTADO"
                    ? "Sin resultado"
                    : `Resultado: ${LORA_AUDIT_RESULT_LABELS[
                        option.value as LoraAuditResult
                      ].toLowerCase()}`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={audit.status}
            onValueChange={(value) => updateStatus.mutate(value as LoraAuditStatus)}
            disabled={updateStatus.isPending}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  Cambiar a: {LORA_AUDIT_STATUS_LABELS[status].toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" asChild>
            <a href={loraReportPdfUrl(audit.id)} target="_blank" rel="noreferrer">
              <FileTextIcon className="h-4 w-4 mr-1" /> Descargar informe
            </a>
          </Button>
        </div>
      </div>
      <nav className="flex gap-1 border-b pb-1">
        {TABS.map((tab) => {
          const to = `/lora/${auditId}${tab.key ? `/${tab.key}` : ""}`;
          const active =
            tab.key === ""
              ? location.pathname === `/lora/${auditId}`
              : location.pathname.startsWith(to);
          return (
            <Link
              key={tab.key}
              to={to}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground",
                active && "bg-primary/10 text-primary"
              )}
            >
              {tab.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default LoraAuditHeader;