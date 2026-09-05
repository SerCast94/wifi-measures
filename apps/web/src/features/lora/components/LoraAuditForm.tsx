import { useState } from "react";

import { Badge } from "@/core/atomic-components/badge";
import { Button } from "@/core/atomic-components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/atomic-components/card";
import { Input } from "@/core/atomic-components/input";
import { Label } from "@/core/atomic-components/label";
import { MultiSelect } from "@/core/atomic-components/multiselect";
import { LoraCsvUploadButton } from "./LoraCsvUploadButton";
import { useLoraMeasures, useLoraNoise } from "../hooks/use-lora";
import type { CreateLoraAuditInput } from "../api/lora-api";
import type { LoraAudit, LoraMeasure, LoraNoise } from "../types/lora.types";

interface LoraAuditFormProps {
  initial?: LoraAudit;
  submitLabel: string;
  pending: boolean;
  onSubmit: (input: CreateLoraAuditInput) => Promise<unknown>;
  onCancelTo: string;
}

const toDateInput = (iso: string | null): string =>
  iso ? new Date(iso).toISOString().slice(0, 10) : "";

export const LoraAuditForm = ({
  initial,
  submitLabel,
  pending,
  onSubmit,
  onCancelTo,
}: LoraAuditFormProps) => {
  const { data: measures } = useLoraMeasures();
  const { data: noise } = useLoraNoise();

  const [measureIds, setMeasureIds] = useState<string[]>(
    (initial?.measures ?? []).map((m) => String(m.id))
  );
  const [noiseIds, setNoiseIds] = useState<string[]>(
    (initial?.noise ?? []).map((n) => String(n.id))
  );
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    code: initial?.code ?? "",
    client: initial?.client ?? "",
    project: initial?.project ?? "",
    location: initial?.location ?? "",
    technician: initial?.technician ?? "",
    objective: initial?.objective ?? "",
    description: initial?.description ?? "",
    startDate: toDateInput(initial?.startDate ?? null),
    endDate: toDateInput(initial?.endDate ?? null),
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleMeasuresCreated = (created: LoraMeasure[] | LoraNoise[]) => {
    const ids = (created as LoraMeasure[]).map((measure) => String(measure.id));
    setMeasureIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const handleNoiseCreated = (created: LoraMeasure[] | LoraNoise[]) => {
    const ids = (created as LoraNoise[]).map((row) => String(row.id));
    setNoiseIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    await onSubmit({
      name: form.name.trim(),
      code: form.code.trim() || null,
      client: form.client.trim() || null,
      project: form.project.trim() || null,
      location: form.location.trim() || null,
      technician: form.technician.trim() || null,
      objective: form.objective.trim() || null,
      description: form.description.trim() || null,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      measureIds: measureIds.map((id) => Number(id)),
      noiseIds: noiseIds.map((id) => Number(id)),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Datos generales</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="lora-audit-name">Nombre *</Label>
            <Input
              id="lora-audit-name"
              value={form.name}
              onChange={(event) => set("name")(event.target.value)}
              placeholder="Auditoría LoRa nave planta baja"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="grid gap-2">
              <Label htmlFor="lora-audit-code">Código</Label>
              <Input
                id="lora-audit-code"
                value={form.code}
                onChange={(event) => set("code")(event.target.value)}
                placeholder="AUD-LORA-2026-001"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lora-audit-client">Cliente</Label>
              <Input
                id="lora-audit-client"
                value={form.client}
                onChange={(event) => set("client")(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lora-audit-project">Proyecto</Label>
              <Input
                id="lora-audit-project"
                value={form.project}
                onChange={(event) => set("project")(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lora-audit-location">Ubicación</Label>
              <Input
                id="lora-audit-location"
                value={form.location}
                onChange={(event) => set("location")(event.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="lora-audit-technician">Técnico</Label>
              <Input
                id="lora-audit-technician"
                value={form.technician}
                onChange={(event) => set("technician")(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lora-audit-objective">Objetivo</Label>
              <Input
                id="lora-audit-objective"
                value={form.objective}
                onChange={(event) => set("objective")(event.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="lora-audit-description">Descripción</Label>
            <textarea
              id="lora-audit-description"
              value={form.description}
              onChange={(event) => set("description")(event.target.value)}
              rows={3}
              placeholder="Descripción general de la auditoría…"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Selección de datos</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label>
                  Medidas LoRa
                  {measures && measures.length > 0 ? (
                    <span className="ml-1 font-normal text-muted-foreground">
                      ({measures.length} disponibles)
                    </span>
                  ) : null}
                </Label>
                <LoraCsvUploadButton
                  kind="measures"
                  label="Subir CSV"
                  multiple
                  onCreated={handleMeasuresCreated}
                />
              </div>
              <MultiSelect
                options={(measures ?? []).map((measure) => ({
                  label: `#${measure.id} — ${measure.location ?? "Sin ubicación"}`,
                  value: String(measure.id),
                }))}
                values={measureIds}
                onValueChange={setMeasureIds}
                placeholder="Selecciona una o más medidas…"
                maxCount={3}
              />
              <div className="flex flex-wrap items-center gap-1">
                {(measures ?? [])
                  .filter((m) => measureIds.includes(String(m.id)))
                  .map((m) => (
                    <Badge key={m.id} variant="secondary">
                      #{m.id}
                    </Badge>
                  ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {measures && measures.length > 0
                  ? "Selecciona una o varias medidas o sube un CSV para añadir más en cualquier momento."
                  : "Aún no hay medidas cargadas. Pulsa «Subir CSV» para cargarlas o ve a la sección «Medidas»."}
              </p>
            </div>
            <div className="grid gap-2">
              <div className="flex items-center justify-between gap-2">
                <Label>
                  Ruido
                  {noise && noise.length > 0 ? (
                    <span className="ml-1 font-normal text-muted-foreground">
                      ({noise.length} disponibles)
                    </span>
                  ) : null}
                </Label>
                <LoraCsvUploadButton
                  kind="noise"
                  label="Subir CSV"
                  multiple
                  onCreated={handleNoiseCreated}
                />
              </div>
              <MultiSelect
                options={(noise ?? []).map((row) => ({
                  label: `#${row.id} — ${row.location ?? "Sin ubicación"}`,
                  value: String(row.id),
                }))}
                values={noiseIds}
                onValueChange={setNoiseIds}
                placeholder="Selecciona uno o más ruidos…"
                maxCount={3}
              />
              <div className="flex flex-wrap items-center gap-1">
                {(noise ?? [])
                  .filter((n) => noiseIds.includes(String(n.id)))
                  .map((n) => (
                    <Badge key={n.id} variant="secondary">
                      #{n.id}
                    </Badge>
                  ))}
              </div>
              <p className="text-xs text-muted-foreground">
                {noise && noise.length > 0
                  ? "Selecciona uno o varios registros de ruido o sube un CSV para añadir más en cualquier momento."
                  : "Aún no hay ruido cargado. Pulsa «Subir CSV» para cargarlo o ve a la sección «Ruido»."}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Planificación</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="lora-audit-start">Fecha inicio</Label>
              <Input
                id="lora-audit-start"
                type="date"
                value={form.startDate}
                onChange={(event) => set("startDate")(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lora-audit-end">Fecha fin</Label>
              <Input
                id="lora-audit-end"
                type="date"
                value={form.endDate}
                onChange={(event) => set("endDate")(event.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center justify-end gap-2">
        <Button type="button" variant="outline" asChild>
          <a href={onCancelTo}>Cancelar</a>
        </Button>
        <Button type="submit" disabled={pending}>
          {pending ? "Guardando…" : submitLabel}
        </Button>
      </div>
    </form>
  );
};
