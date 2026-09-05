import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import {
  ClipboardListIcon,
  FileTextIcon,
  PlusIcon,
  Trash2Icon,
} from "lucide-react";

import { Button } from "@/core/atomic-components/button";
import { Badge } from "@/core/atomic-components/badge";
import { Input } from "@/core/atomic-components/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/atomic-components/card";
import { EmptyState } from "@/core/atomic-components/empty-state";
import CustomLoading from "@/core/components/CustomLoading";
import { loraReportPdfUrl } from "@/features/lora/api/lora-api";
import { LoraAuditStatusBadge } from "@/features/lora/components/badges";
import {
  useDeleteLoraAudit,
  useLoraAudits,
} from "@/features/lora/hooks/use-lora";

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("es-ES") : "—";

const LoraAuditsPage = () => {
  const [q, setQ] = useState("");
  const { data: audits, isLoading } = useLoraAudits(q || undefined);
  const deleteAudit = useDeleteLoraAudit();

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`¿Eliminar la auditoría LoRa "${name}"?`)) return;
    deleteAudit.mutate(id, {
      onSuccess: () => toast.success("Auditoría eliminada."),
    });
  };

  return (
    <div className="w-full px-2 py-2 mx-auto mb-4 sm:px-10 sm:py-6 xl:px-16 xl:py-8 animate-in fade-in-0">
      <div className="flex flex-col items-center justify-between gap-2 mt-2 mb-4 sm:flex-row">
        <h1 className="flex gap-4 px-2 mb-2 text-lg font-bold sm:items-center sm:text-2xl">
          <ClipboardListIcon className="w-6 h-6" />
          Auditorías LoRa
        </h1>
        <div className="flex items-center gap-2">
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Buscar por nombre o cliente…"
            className="w-full sm:w-64"
          />
          <Button asChild>
            <Link to="/lora/new">
              <PlusIcon className="w-4 h-4 mr-1" /> Nueva auditoría
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <CustomLoading />
      ) : !audits || audits.length === 0 ? (
        <Card>
          <CardContent className="p-0">
            <EmptyState
              icon={ClipboardListIcon}
              title="Todavía no hay auditorías LoRa"
              description="Crea la primera auditoría para empezar a organizar medidas, ruido y planos."
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {audits.map((audit) => (
            <Card key={audit.id} className="group relative h-full transition-shadow hover:shadow-md">
              <Link to={`/lora/${audit.id}`} className="block h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-start justify-between gap-2 text-base">
                    <span>{audit.name}</span>
                    <LoraAuditStatusBadge status={audit.status} />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p>{[audit.code, audit.client].filter(Boolean).join(" · ") || "—"}</p>
                  <p>{audit.location ?? "Sin ubicación"}</p>
                  <p className="text-xs">
                    {audit.measures.length > 0 || audit.noise.length > 0 ? (
                      <span className="inline-flex flex-wrap items-center gap-1">
                        {audit.measures.length > 0 ? (
                          <Badge variant="outline">
                            Medidas: {audit.measures.length}
                          </Badge>
                        ) : null}
                        {audit.noise.length > 0 ? (
                          <Badge variant="outline">
                            Ruido: {audit.noise.length}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">
                            Sin ruido asociado
                          </span>
                        )}
                      </span>
                    ) : (
                      "Sin medidas ni ruido asociados"
                    )}
                  </p>
                  <p className="text-xs">
                    {formatDate(audit.startDate)} → {formatDate(audit.endDate)}
                  </p>
                </CardContent>
              </Link>
              <div className="absolute right-1 top-1 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <Button size="icon" variant="ghost" asChild className="h-7 w-7">
                  <a href={loraReportPdfUrl(audit.id)} target="_blank" rel="noreferrer">
                    <FileTextIcon className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-7 w-7 hover:text-destructive"
                  onClick={() => handleDelete(audit.id, audit.name)}
                  disabled={deleteAudit.isPending}
                >
                  <Trash2Icon className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default LoraAuditsPage;
