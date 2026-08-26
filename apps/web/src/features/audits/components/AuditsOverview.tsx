import { Link } from "react-router";
import {
  Activity,
  AlertTriangle,
  CheckCircle2,
  CircleHelp,
  ClipboardListIcon,
  XCircle,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/core/atomic-components/card";
import { useAuditsStats } from "@/features/audits/hooks/use-audits";
import { AuditStatusBadge } from "@/features/audits/components/badges";

const AuditsOverview = () => {
  const { data: stats } = useAuditsStats();

  if (!stats) return null;

  const evaluations = stats.totals.evaluations;
  const pctPass =
    evaluations.total > 0
      ? Math.round((evaluations.PASS / evaluations.total) * 100)
      : null;
  const pctFail =
    evaluations.total > 0
      ? Math.round((evaluations.FAIL / evaluations.total) * 100)
      : null;

  return (
    <Card className="mb-6">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-base">
          <ClipboardListIcon className="w-4 h-4" /> Estado de las auditorías
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4 mb-4">
          <div className="rounded-md border p-3">
            <p className="text-2xl font-bold">{stats.totals.audits}</p>
            <p className="text-muted-foreground">auditorías totales</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="flex items-center gap-1 text-2xl font-bold text-green-700">
              {pctPass !== null ? `${pctPass}%` : "—"}
            </p>
            <p className="text-muted-foreground">
              criterios conformes ({evaluations.PASS}/{evaluations.total})
            </p>
          </div>
          <div className="rounded-md border p-3">
            <p className="flex items-center gap-1 text-2xl font-bold text-red-700">
              {pctFail !== null ? `${pctFail}%` : "—"}
            </p>
            <p className="text-muted-foreground">criterios no conformes</p>
          </div>
          <div className="rounded-md border p-3">
            <p className="flex items-center gap-1 text-2xl font-bold text-amber-600">
              <AlertTriangle className="w-5 h-5" /> {stats.totals.openIssues}
            </p>
            <p className="text-muted-foreground">incidencias abiertas</p>
          </div>
        </div>

        <div className="mb-4 flex flex-wrap gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-green-600" /> {evaluations.PASS} conforme
          </span>
          <span className="flex items-center gap-1">
            <XCircle className="h-3.5 w-3.5 text-red-600" /> {evaluations.FAIL} no conforme
          </span>
          <span className="flex items-center gap-1">
            <CircleHelp className="h-3.5 w-3.5" /> {evaluations.UNKNOWN} sin datos
          </span>
          <span className="flex items-center gap-1">
            <Activity className="h-3.5 w-3.5" /> {Object.entries(stats.byStatus).map(([status, count]) => `${status.replace(/_/g, " ").toLowerCase()}: ${count}`).join(" · ")}
          </span>
        </div>

        {stats.totals.syncErrors > 0 ? (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            ⚠️ {stats.totals.syncErrors} sincronización(es) con errores en los
            últimos 7 días. Revisa el registro de sync de cada auditoría.
          </div>
        ) : null}

        {stats.recent.length > 0 ? (
          <div>
            <p className="mb-2 text-sm font-medium">Auditorías recientes</p>
            <ul className="divide-y rounded-md border">
              {stats.recent.map((audit) => (
                <li key={audit.id}>
                  <Link
                    to={`/audits/${audit.id}`}
                    className="flex items-center justify-between gap-2 px-3 py-2 hover:bg-muted"
                  >
                    <span className="min-w-0 truncate text-sm">{audit.name}</span>
                    <span className="flex shrink-0 items-center gap-2">
                      <AuditStatusBadge status={audit.status} />
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            Crea tu primera auditoría desde la sección Auditorías.
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default AuditsOverview;
