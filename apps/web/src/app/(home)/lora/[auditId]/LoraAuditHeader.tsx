import { Link, useLocation, useParams } from "react-router";
import { FileTextIcon } from "lucide-react";

import { cn } from "@/core/lib/utils";
import { Button } from "@/core/atomic-components/button";
import { LoraAuditStatusBadge } from "@/features/lora/components/badges";
import { useLoraAudit } from "@/features/lora/hooks/use-lora";
import { loraReportPdfUrl } from "@/features/lora/api/lora-api";

const TABS = [
  { key: "", label: "Resumen" },
  { key: "analisis", label: "Análisis" },
];

const LoraAuditHeader = () => {
  const { auditId = "" } = useParams<{ auditId: string }>();
  const location = useLocation();
  const { data: audit } = useLoraAudit(auditId);

  if (!audit) return null;

  return (
    <div className="mb-4 space-y-3">
      <div className="flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-bold sm:text-2xl">{audit.name}</h1>
          <LoraAuditStatusBadge status={audit.status} />
        </div>
        <div className="flex items-center gap-2">
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
