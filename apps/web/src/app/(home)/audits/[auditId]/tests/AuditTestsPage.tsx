import { useState } from "react";
import { useParams } from "react-router";
import { toast } from "sonner";

import { Button } from "@/core/atomic-components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/atomic-components/card";
import { Progress } from "@/core/atomic-components/progress";
import CustomLoading from "@/core/components/CustomLoading";
import AuditHeader from "../AuditHeader";
import { EvalStatusBadge } from "@/features/audits/components/badges";
import {
  useAuditTests,
  useUpdateAuditTest,
} from "@/features/audits/hooks/use-audit-workflow";
import type { AuditTest } from "@/features/audits/types/audit.types";

const SECTION_ORDER = [
  "PRE_AUDITORIA",
  "RECONOCIMIENTO_RF",
  "COBERTURA",
  "CONECTIVIDAD",
  "RENDIMIENTO",
  "MOVILIDAD",
  "CIERRE",
];

const SECTION_TITLES: Record<string, string> = {
  PRE_AUDITORIA: "Pre-auditoría",
  RECONOCIMIENTO_RF: "Reconocimiento RF",
  COBERTURA: "Cobertura",
  CONECTIVIDAD: "Conectividad",
  RENDIMIENTO: "Rendimiento",
  MOVILIDAD: "Movilidad / roaming",
  CIERRE: "Cierre y entrega",
};

const TestRow = ({ test, auditId }: { test: AuditTest; auditId: string }) => {
  const updateTest = useUpdateAuditTest(auditId);
  const [showNotes, setShowNotes] = useState(Boolean(test.notes));
  const [notes, setNotes] = useState(test.notes ?? "");

  const setStatus = async (status: string) => {
    try {
      await updateTest.mutateAsync({ testId: test.id, status });
    } catch {
      // gestionado globalmente
    }
  };

  const saveNotes = async () => {
    try {
      await updateTest.mutateAsync({ testId: test.id, notes });
      toast.success("Nota guardada.");
    } catch {
      // gestionado globalmente
    }
  };

  const labels: Record<string, string> = {
    PENDIENTE: "Pendiente",
    COMPLETADA: "Completada",
    NO_APLICABLE: "No aplica",
  };

  return (
    <div className="border-b py-3 last:border-b-0">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1 min-w-0">
          <p className="text-sm font-medium">
            {test.title}
            {!test.required ? (
              <span className="ml-2 text-xs text-muted-foreground">(opcional)</span>
            ) : null}
          </p>
          <div className="flex items-center gap-2">
            {test.resultStatus ? <EvalStatusBadge status={test.resultStatus} /> : null}
            {test.notes ? (
              <span className="truncate text-xs text-muted-foreground">📝 {test.notes}</span>
            ) : null}
          </div>
        </div>
        {/* Modo campo: rejilla a ancho completo en móvil, botones grandes */}
        <div className="grid grid-cols-3 gap-2 sm:flex sm:w-auto">
          {["PENDIENTE", "COMPLETADA", "NO_APLICABLE"].map((status) => (
            <Button
              key={status}
              size="sm"
              className="h-11 px-4 text-sm sm:h-8 sm:px-3"
              variant={test.status === status ? "default" : "outline"}
              disabled={updateTest.isPending}
              onClick={() => setStatus(status)}
            >
              {labels[status]}
            </Button>
          ))}
        </div>
      </div>

      <div className="mt-2">
        {showNotes ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              rows={2}
              placeholder="Observaciones de campo…"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
            <Button size="sm" variant="outline" onClick={saveNotes} disabled={updateTest.isPending}>
              Guardar nota
            </Button>
          </div>
        ) : (
          <button
            type="button"
            className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            onClick={() => setShowNotes(true)}
          >
            + Añadir nota
          </button>
        )}
      </div>
    </div>
  );
};

const AuditTestsPage = () => {
  const { auditId = "" } = useParams<{ auditId: string }>();
  const { data: tests, isLoading } = useAuditTests(auditId);
  const [filter, setFilter] = useState<"TODAS" | "PENDIENTES">("TODAS");

  if (isLoading || !tests) return <CustomLoading />;

  const requiredTests = tests.filter((test) => test.required);
  // «No aplica» resuelve el ítem: se resta del denominador.
  const applicable = requiredTests.filter(
    (test) => test.status !== "NO_APLICABLE"
  );
  const completed = requiredTests.filter(
    (test) => test.status === "COMPLETADA"
  ).length;
  const pct =
    applicable.length > 0
      ? Math.round((completed / applicable.length) * 100)
      : 0;

  const visible =
    filter === "PENDIENTES"
      ? tests.filter((test) => test.status === "PENDIENTE")
      : tests;

  return (
    <div className="container max-w-4xl px-2 py-2 mx-auto mb-4 sm:py-6 animate-in fade-in-0">
      <AuditHeader />

      <Card className="sticky top-0 z-10 mb-4 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center justify-between">
            <span>Progreso</span>
            <span className="text-sm font-normal text-muted-foreground">
              {completed}/{applicable.length} aplicables
              {requiredTests.length !== applicable.length
                ? ` · ${requiredTests.length - applicable.length} no aplica`
                : ""}
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Progress value={pct} />
        </CardContent>
      </Card>

      <div className="mb-3 flex gap-2">
        {(["TODAS", "PENDIENTES"] as const).map((option) => (
          <Button
            key={option}
            size="sm"
            variant={filter === option ? "default" : "outline"}
            onClick={() => setFilter(option)}
          >
            {option === "TODAS" ? "Todas" : "Solo pendientes"}
          </Button>
        ))}
      </div>

      {SECTION_ORDER.map((section) => {
        const sectionTests = visible.filter((test) => test.section === section);
        if (sectionTests.length === 0) return null;
        return (
          <Card key={section} className="mb-4">
            <CardHeader className="pb-1">
              <CardTitle className="text-base">
                {SECTION_TITLES[section] ?? section}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {sectionTests.map((test) => (
                <TestRow key={test.id} test={test} auditId={auditId} />
              ))}
            </CardContent>
          </Card>
        );
      })}
      {visible.length === 0 && filter === "PENDIENTES" ? (
        <p className="p-8 text-center text-muted-foreground">
          No queda nada pendiente. ¡Buen trabajo!
        </p>
      ) : null}
    </div>
  );
};

export default AuditTestsPage;
