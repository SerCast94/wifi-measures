import { Link, useLocation, useParams } from "react-router";

import { cn } from "@/core/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/atomic-components/select";
import { useAudit, useUpdateAuditStatus } from "@/features/audits/hooks/use-audits";
import { AuditStatusBadge } from "@/features/audits/components/badges";
import type { AuditStatus } from "@/features/audits/types/audit.types";

const TABS = [
  { key: "", label: "Resumen" },
  { key: "config", label: "Configuración" },
  { key: "tests", label: "Checklist" },
  { key: "detalles", label: "Evaluación" },
  { key: "incidencias", label: "Incidencias" },
  { key: "informe", label: "Informe" },
];

const STATUS_OPTIONS: AuditStatus[] = [
  "BORRADOR",
  "EN_PROGRESO",
  "COMPLETADA",
  "PENDIENTE_DE_REVISION",
  "INFORME_GENERADO",
  "ARCHIVADA",
];

const AuditHeader = () => {
  const { auditId = "" } = useParams<{ auditId: string }>();
  const location = useLocation();
  const { data: audit } = useAudit(auditId);
  const updateStatus = useUpdateAuditStatus(auditId);

  if (!audit) return null;

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold">{audit.name}</h2>
            <AuditStatusBadge status={audit.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {[audit.code, audit.client, audit.location]
              .filter(Boolean)
              .join(" · ") || "Sin metadatos"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link
            to={`/audits/${auditId}/editar`}
            className="rounded-md border px-3 py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Editar datos
          </Link>
          <Select
            value={audit.status}
            onValueChange={(value) => updateStatus.mutate(value)}
          >
            <SelectTrigger className="w-52">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  Cambiar a: {status.replace(/_/g, " ").toLowerCase()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <nav className="flex gap-1 border-b pb-1">
        {TABS.map((tab) => {
          const to = `/audits/${auditId}${tab.key ? `/${tab.key}` : ""}`;
          const active =
            tab.key === ""
              ? location.pathname === `/audits/${auditId}`
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

export default AuditHeader;
