import { useEffect, useState } from "react";
import { SaveIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/core/atomic-components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/atomic-components/dialog";
import { Input } from "@/core/atomic-components/input";
import { Label } from "@/core/atomic-components/label";
import { useUpdateLoraAudit } from "../hooks/use-lora";
import type { LoraAudit } from "../types/lora.types";

const toDateInput = (iso: string | null): string =>
  iso ? new Date(iso).toISOString().slice(0, 10) : "";

interface EditLoraAuditDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  audit: LoraAudit | null;
}

export const EditLoraAuditDialog = ({
  open,
  onOpenChange,
  audit,
}: EditLoraAuditDialogProps) => {
  const updateAudit = useUpdateLoraAudit();
  const [form, setForm] = useState({
    name: "",
    code: "",
    client: "",
    project: "",
    location: "",
    technician: "",
    objective: "",
    description: "",
    startDate: "",
    endDate: "",
    auditDate: "",
  });

  useEffect(() => {
    if (!audit) return;
    setForm({
      name: audit.name ?? "",
      code: audit.code ?? "",
      client: audit.client ?? "",
      project: audit.project ?? "",
      location: audit.location ?? "",
      technician: audit.technician ?? "",
      objective: audit.objective ?? "",
      description: audit.description ?? "",
      startDate: toDateInput(audit.startDate),
      endDate: toDateInput(audit.endDate),
      auditDate: toDateInput(audit.auditDate),
    });
  }, [audit, open]);

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!audit) return;
    if (!form.name.trim()) {
      toast.error("El nombre es obligatorio.");
      return;
    }
    const toIso = (value: string): string | null =>
      value ? new Date(value).toISOString() : null;
    try {
      await updateAudit.mutateAsync({
        id: audit.id,
        input: {
          name: form.name.trim(),
          code: form.code.trim() || null,
          client: form.client.trim() || null,
          project: form.project.trim() || null,
          location: form.location.trim() || null,
          technician: form.technician.trim() || null,
          objective: form.objective.trim() || null,
          description: form.description.trim() || null,
          startDate: toIso(form.startDate),
          endDate: toIso(form.endDate),
          auditDate: toIso(form.auditDate),
        },
      });
      toast.success("Datos generales actualizados.");
      onOpenChange(false);
    } catch (err) {
      toast.error(
        `Error al guardar los datos: ${(err as Error).message}`
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar datos generales</DialogTitle>
          <DialogDescription>
            Modifica los datos generales de la auditoría. Los cambios se guardan
            en la auditoría existente.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-2">
            <Label htmlFor="edit-lora-name">Nombre *</Label>
            <Input
              id="edit-lora-name"
              value={form.name}
              onChange={(event) => set("name")(event.target.value)}
              placeholder="Auditoría LoRa nave planta baja"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-lora-code">Código</Label>
              <Input
                id="edit-lora-code"
                value={form.code}
                onChange={(event) => set("code")(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-lora-client">Cliente</Label>
              <Input
                id="edit-lora-client"
                value={form.client}
                onChange={(event) => set("client")(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-lora-project">Proyecto</Label>
              <Input
                id="edit-lora-project"
                value={form.project}
                onChange={(event) => set("project")(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-lora-location">Ubicación</Label>
              <Input
                id="edit-lora-location"
                value={form.location}
                onChange={(event) => set("location")(event.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="edit-lora-technician">Técnico</Label>
              <Input
                id="edit-lora-technician"
                value={form.technician}
                onChange={(event) => set("technician")(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-lora-objective">Objetivo</Label>
              <Input
                id="edit-lora-objective"
                value={form.objective}
                onChange={(event) => set("objective")(event.target.value)}
              />
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="edit-lora-description">Descripción</Label>
            <textarea
              id="edit-lora-description"
              value={form.description}
              onChange={(event) => set("description")(event.target.value)}
              rows={3}
              placeholder="Descripción general de la auditoría…"
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="grid gap-2">
              <Label htmlFor="edit-lora-start">Fecha inicio</Label>
              <Input
                id="edit-lora-start"
                type="date"
                value={form.startDate}
                onChange={(event) => set("startDate")(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-lora-end">Fecha fin</Label>
              <Input
                id="edit-lora-end"
                type="date"
                value={form.endDate}
                onChange={(event) => set("endDate")(event.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-lora-audit">Fecha auditoría</Label>
              <Input
                id="edit-lora-audit"
                type="date"
                value={form.auditDate}
                onChange={(event) => set("auditDate")(event.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={updateAudit.isPending}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={updateAudit.isPending}>
              <SaveIcon className="mr-2 h-4 w-4" />
              {updateAudit.isPending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};