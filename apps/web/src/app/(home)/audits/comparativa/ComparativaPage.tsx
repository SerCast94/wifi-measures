import { useState } from "react";
import { Link } from "react-router";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3Icon, GitCompareIcon } from "lucide-react";

import CustomLoading from "@/core/components/CustomLoading";
import { Card, CardContent, CardHeader, CardTitle } from "@/core/atomic-components/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/atomic-components/select";
import { EvalStatusBadge, AuditStatusBadge } from "@/features/audits/components/badges";
import { useAuditsComparison } from "@/features/audits/hooks/use-audits";
import { Progress } from "@/core/atomic-components/progress";

const GLOBAL_LABELS: Record<string, string> = {
  APROBADO: "Aprobado",
  APROBADO_CON_OBSERVACIONES: "Con observaciones",
  NO_CONFORME: "No conforme",
  SIN_DATOS_SUFICIENTES: "Sin datos",
};

const ComparativaPage = () => {
  const { data: audits, isLoading } = useAuditsComparison();
  const [mode, setMode] = useState<"todas" | "duelo">("todas");
  const [leftId, setLeftId] = useState<string>("");
  const [rightId, setRightId] = useState<string>("");

  if (isLoading || !audits) return <CustomLoading />;

  const chartData = audits
    .slice()
    .reverse()
    .map((audit) => ({
      name: audit.code || audit.name.slice(0, 14),
      Conforme: audit.evaluations.PASS,
      Límite: audit.evaluations.WARNING,
      "No conforme": audit.evaluations.FAIL,
      "Sin datos": audit.evaluations.UNKNOWN,
    }));

  const left = audits.find((a) => a.id === leftId);
  const right = audits.find((a) => a.id === rightId);

  return (
    <div className="w-full px-2 py-2 mx-auto mb-4 sm:px-10 sm:py-6 xl:px-16 xl:py-8 animate-in fade-in-0">
      <div className="flex flex-col items-start justify-between gap-2 mb-6 sm:flex-row sm:items-center">
        <h1 className="flex gap-4 px-2 text-lg font-bold sm:items-center sm:text-2xl">
          <BarChart3Icon className="w-6 h-6" />
          Comparativa de auditorías
        </h1>
        <div className="flex gap-2">
          {(["todas", "duelo"] as const).map((option) => (
            <button
              key={option}
              onClick={() => setMode(option)}
              className={
                mode === option
                  ? "rounded-md bg-primary/10 px-3 py-1.5 text-sm font-medium text-primary"
                  : "rounded-md px-3 py-1.5 text-sm text-muted-foreground hover:bg-muted"
              }
            >
              {option === "todas" ? "Todas" : "Comparar 2"}
            </button>
          ))}
        </div>
      </div>

      {audits.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center text-muted-foreground">
            Todavía no hay auditorías para comparar.
          </CardContent>
        </Card>
      ) : mode === "todas" ? (
        <>
          <Card className="mb-6">
            <CardHeader className="pb-0">
              <CardTitle className="text-base">Resultados por auditoría (últimas {audits.length})</CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" fontSize={11} />
                  <YAxis allowDecimals={false} fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Conforme" stackId="a" fill="#16a34a" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="Límite" stackId="a" fill="#d97706" />
                  <Bar dataKey="No conforme" stackId="a" fill="#dc2626" />
                  <Bar dataKey="Sin datos" stackId="a" fill="#9ca3af" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <div className="overflow-x-auto rounded-md border">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b bg-muted/50 text-left">
                  <th className="px-3 py-2">Auditoría</th>
                  <th className="px-3 py-2">Cliente</th>
                  <th className="px-3 py-2">Estado</th>
                  <th className="px-3 py-2">Resultado</th>
                  <th className="px-3 py-2 text-right">Conformes</th>
                  <th className="px-3 py-2 text-right">% conforme</th>
                </tr>
              </thead>
              <tbody>
                {audits.map((audit) => (
                  <tr key={audit.id} className="border-b last:border-b-0 hover:bg-muted/30">
                    <td className="px-3 py-2">
                      <Link to={`/audits/${audit.id}`} className="font-medium underline-offset-2 hover:underline">
                        {audit.name}
                      </Link>
                      {audit.code ? (
                        <span className="ml-2 text-xs text-muted-foreground">{audit.code}</span>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">{audit.client ?? "—"}</td>
                    <td className="px-3 py-2">
                      <AuditStatusBadge status={audit.status} />
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {audit.globalResult
                        ? GLOBAL_LABELS[audit.globalResult] ?? audit.globalResult
                        : "Sin evaluar"}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {audit.evaluations.PASS}/{audit.evaluations.total}
                    </td>
                    <td className="px-3 py-2 text-right font-medium tabular-nums">
                      {audit.evaluations.total > 0
                        ? `${Math.round((audit.evaluations.PASS / audit.evaluations.total) * 100)}%`
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <Card>
            <CardContent className="grid gap-4 p-4 sm:grid-cols-2">
              {[
                { value: leftId, onChange: setLeftId, label: "Auditoría A" },
                { value: rightId, onChange: setRightId, label: "Auditoría B" },
              ].map((slot) => (
                <div key={slot.label} className="grid gap-2">
                  <p className="text-sm font-medium">{slot.label}</p>
                  <Select value={slot.value} onValueChange={slot.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona…" />
                    </SelectTrigger>
                    <SelectContent>
                      {audits.map((audit) => (
                        <SelectItem key={audit.id} value={audit.id}>
                          {audit.code ? `${audit.code} · ` : ""}
                          {audit.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </CardContent>
          </Card>

          {left && right && left.id !== right.id ? (
            <>
              <div className="grid gap-4 lg:grid-cols-2">
                {[left, right].map((audit) => (
                  <Card key={audit.id}>
                    <CardHeader className="pb-1">
                      <CardTitle className="flex items-center justify-between gap-2 text-base">
                        <span className="truncate">{audit.name}</span>
                        <AuditStatusBadge status={audit.status} />
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <p className="text-muted-foreground">
                        {audit.client ?? "Sin cliente"} ·{" "}
                        {audit.globalResult
                          ? GLOBAL_LABELS[audit.globalResult] ?? audit.globalResult
                          : "Sin evaluar"}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <EvalStatusBadge status="PASS" />
                        <span className="font-semibold">{audit.evaluations.PASS}</span>
                        <EvalStatusBadge status="WARNING" />
                        <span className="font-semibold">{audit.evaluations.WARNING}</span>
                        <EvalStatusBadge status="FAIL" />
                        <span className="font-semibold">{audit.evaluations.FAIL}</span>
                        <EvalStatusBadge status="UNKNOWN" />
                        <span className="font-semibold">{audit.evaluations.UNKNOWN}</span>
                      </div>
                      <Progress
                        value={
                          audit.evaluations.total > 0
                            ? Math.round((audit.evaluations.PASS / audit.evaluations.total) * 100)
                            : 0
                        }
                      />
                      <p className="text-xs text-muted-foreground">
                        {audit.evaluations.total > 0
                          ? `${Math.round((audit.evaluations.PASS / audit.evaluations.total) * 100)}% conforme (${audit.evaluations.PASS}/${audit.evaluations.total})`
                          : "Sin evaluaciones"}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <Card>
                <CardHeader className="pb-0">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <GitCompareIcon className="w-4 h-4" /> Cara a cara
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={(["PASS", "WARNING", "FAIL", "UNKNOWN"] as const).map((key) => ({
                        criterio: key,
                        [left.code || left.name.slice(0, 12)]: left.evaluations[key],
                        [right.code || right.name.slice(0, 12)]: right.evaluations[key],
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" vertical={false} />
                      <XAxis dataKey="criterio" fontSize={11} />
                      <YAxis allowDecimals={false} fontSize={11} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey={left.code || left.name.slice(0, 12)} fill="#2563eb" radius={[3, 3, 0, 0]} />
                      <Bar dataKey={right.code || right.name.slice(0, 12)} fill="#f59e0b" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Selecciona dos auditorías distintas para compararlas.
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default ComparativaPage;
