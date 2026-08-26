import { useState } from "react";

import { Button } from "@/core/atomic-components/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/core/atomic-components/card";
import { Input } from "@/core/atomic-components/input";
import { Label } from "@/core/atomic-components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/atomic-components/select";
import { Separator } from "@/core/atomic-components/separator";
import { useAuditProfiles } from "../hooks/use-audits";
import type { Audit } from "../types/audit.types";
import type { CreateAuditInput } from "../api/audit-crud";

interface AuditFormProps {
  initial?: Audit;
  submitLabel: string;
  pending: boolean;
  onSubmit: (input: CreateAuditInput) => Promise<unknown>;
  onCancelTo: string;
}

const toDateInput = (iso: string | null): string =>
  iso ? new Date(iso).toISOString().slice(0, 10) : "";

/**
 * Formulario compartido de creación/edición de auditoría, incluyendo los
 * filtros avanzados de capturas (claves de área y SSID objetivo).
 */
const AuditForm = ({ initial, submitLabel, pending, onSubmit, onCancelTo }: AuditFormProps) => {
  const { data: profiles } = useAuditProfiles();
  const [profileId, setProfileId] = useState<string>(initial?.profile?.id ?? "");
  const [form, setForm] = useState({
    name: initial?.name ?? "",
    code: initial?.code ?? "",
    client: initial?.client ?? "",
    project: initial?.project ?? "",
    location: initial?.location ?? "",
    technician: initial?.technician ?? "",
    startDate: toDateInput(initial?.startDate ?? null),
    endDate: toDateInput(initial?.endDate ?? null),
    areaKeys: (initial?.areaKeys ?? []).join(", "),
    ssidFilter: initial?.ssidFilter ?? "",
    floorNames: "",
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.name.trim()) return;
    await onSubmit({
      name: form.name.trim(),
      code: form.code.trim() || undefined,
      client: form.client.trim() || undefined,
      project: form.project.trim() || undefined,
      location: form.location.trim() || undefined,
      technician: form.technician.trim() || undefined,
      profileId: profileId || undefined,
      startDate: form.startDate ? new Date(form.startDate).toISOString() : null,
      endDate: form.endDate ? new Date(form.endDate).toISOString() : null,
      areaKeys: form.areaKeys
        .split(",")
        .map((key) => key.trim())
        .filter(Boolean),
      ssidFilter: form.ssidFilter.trim() || null,
      ...(initial
        ? {}
        : {
            floorNames: form.floorNames
              .split(/[\n,]/)
              .map((name) => name.trim())
              .filter(Boolean),
          }),
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
            <Label htmlFor="audit-name">Nombre *</Label>
            <Input
              id="audit-name"
              value={form.name}
              onChange={(event) => set("name")(event.target.value)}
              placeholder="Auditoría oficina Calle Serrano"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="audit-code">Código</Label>
              <Input
                id="audit-code"
                value={form.code}
                onChange={(event) => set("code")(event.target.value)}
                placeholder="AUD-2026-001"
              />
            </div>
            <div className="grid gap-2">
              <Label>Perfil de criterios de aceptación</Label>
              <Select value={profileId} onValueChange={setProfileId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona perfil…" />
                </SelectTrigger>
                <SelectContent>
                  {(profiles ?? [])
                    .slice()
                    .sort((a, b) =>
                      a.isDefault === b.isDefault
                        ? a.name.localeCompare(b.name)
                        : a.isDefault
                          ? -1
                          : 1
                    )
                    .map((profile) => (
                      <SelectItem key={profile.id} value={profile.id}>
                        {profile.name}
                        {profile.isDefault ? " (por defecto)" : ""}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="grid gap-2">
              <Label htmlFor="audit-client">Cliente</Label>
              <Input
                id="audit-client"
                value={form.client}
                onChange={(event) => set("client")(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="audit-project">Proyecto</Label>
              <Input
                id="audit-project"
                value={form.project}
                onChange={(event) => set("project")(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="audit-location">Ubicación</Label>
              <Input
                id="audit-location"
                value={form.location}
                onChange={(event) => set("location")(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="audit-tech">Técnico</Label>
              <Input
                id="audit-tech"
                value={form.technician}
                onChange={(event) => set("technician")(event.target.value)}
              />
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
              <Label htmlFor="audit-start">Fecha inicio capturas</Label>
              <Input
                id="audit-start"
                type="date"
                value={form.startDate}
                onChange={(event) => set("startDate")(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="audit-end">Fecha fin capturas</Label>
              <Input
                id="audit-end"
                type="date"
                value={form.endDate}
                onChange={(event) => set("endDate")(event.target.value)}
              />
            </div>
          </div>
          {!initial ? (
            <>
              <Separator />
              <div className="grid gap-2">
                <Label htmlFor="audit-floors">
                  Plantas / zonas (una por línea; se pueden añadir después)
                </Label>
                <textarea
                  id="audit-floors"
                  value={form.floorNames}
                  onChange={(event) => set("floorNames")(event.target.value)}
                  rows={3}
                  placeholder={"Planta 1\nPlanta 2"}
                  className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros de capturas (avanzado)</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <p className="text-xs text-muted-foreground">
            Vacíos incluyen todas las capturas del rango de fechas. Útiles cuando
            el equipo capturó varias zonas o SSIDs en la misma visita.
          </p>
          <div className="grid gap-2">
            <Label htmlFor="audit-areakeys">
              Claves de área / unidad (separadas por comas)
            </Label>
            <Input
              id="audit-areakeys"
              value={form.areaKeys}
              onChange={(event) => set("areaKeys")(event.target.value)}
              placeholder="Norte, Planta 2, Sede Sevilla"
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="audit-ssid">SSID objetivo</Label>
            <Input
              id="audit-ssid"
              value={form.ssidFilter}
              onChange={(event) => set("ssidFilter")(event.target.value)}
              placeholder="MAGTEL-INVITADOS"
            />
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

export default AuditForm;
