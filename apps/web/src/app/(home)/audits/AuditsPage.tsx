import { useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { ClipboardListIcon, PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/core/atomic-components/button";
import { Input } from "@/core/atomic-components/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/atomic-components/card";
import { useAudits, useDeleteAudit } from "@/features/audits/hooks/use-audits";
import { AuditStatusBadge } from "@/features/audits/components/badges";

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString("es-ES") : "—";

const AuditsPage = () => {
  const [q, setQ] = useState("");
  const { data: audits, isLoading } = useAudits(q || undefined);
  const deleteAudit = useDeleteAudit();

  const handleDelete = (id: string, name: string) => {
    if (!window.confirm(`¿Eliminar la auditoría "${name}"? Se borrarán también sus evaluaciones, incidencias e informes.`)) {
      return;
    }
    deleteAudit.mutate(id, {
      onSuccess: () => toast.success("Auditoría eliminada."),
    });
  };

  return (
    <div className="w-full px-2 py-2 mx-auto mb-4 sm:px-10 sm:py-6 xl:px-16 xl:py-8 animate-in fade-in-0">
      <div className="flex flex-col items-center justify-between gap-2 mt-2 mb-4 sm:flex-row">
        <h1 className="flex gap-4 px-2 mb-2 text-lg font-bold sm:items-center sm:text-2xl">
          <ClipboardListIcon className="w-6 h-6" />
          Auditorías
        </h1>
        <div className="flex items-center gap-2">
          <Input
            value={q}
            onChange={(event) => setQ(event.target.value)}
            placeholder="Buscar por nombre o cliente…"
            className="w-full sm:w-64"
          />
          <Button asChild variant="outline">
            <Link to="/audits/comparativa">Comparar</Link>
          </Button>
          <Button asChild>
            <Link to="/audits/new">
              <PlusIcon className="w-4 h-4 mr-1" /> Nueva auditoría
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <p className="p-8 text-center text-muted-foreground">Cargando…</p>
      ) : !audits || audits.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            Todavía no hay auditorías. Crea la primera para empezar a planificar.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {audits.map((audit) => (
            <Card key={audit.id} className="group relative h-full transition-shadow hover:shadow-md">
              <Link to={`/audits/${audit.id}`} className="block h-full">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-start justify-between gap-2 text-base">
                    <span>{audit.name}</span>
                    <AuditStatusBadge status={audit.status} />
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1 text-sm text-muted-foreground">
                  <p>{[audit.code, audit.client].filter(Boolean).join(" · ") || "—"}</p>
                  <p>{audit.location ?? "Sin ubicación"}</p>
                  <p className="text-xs">
                    {formatDate(audit.startDate)} → {formatDate(audit.endDate)}
                  </p>
                </CardContent>
              </Link>
              <Button
                size="icon"
                variant="ghost"
                className="absolute right-1 top-1 h-7 w-7 opacity-0 transition-opacity hover:text-destructive group-hover:opacity-100"
                onClick={() => handleDelete(audit.id, audit.name)}
                disabled={deleteAudit.isPending}
              >
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default AuditsPage;
