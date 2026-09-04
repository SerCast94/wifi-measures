import { useState } from "react";
import { UploadCloud, AlertCircle, Loader2 } from "lucide-react";
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

import { useCreateFloorPlan } from "../hooks/use-create-floorplan";
import { uploadFloorPlan } from "@/features/netally/api/netally.api";
import type { FloorPlan } from "../types/floorplan.types";
import {
  isPdfFile,
  readFileAsDataUrl,
  readImageDimensions,
  sanitizeFileName,
  validateFloorPlanFile,
} from "../lib/floorplan-validation";

interface UploadFloorPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploaded: (plan: FloorPlan) => void;
}

export const UploadFloorPlanDialog = ({
  open,
  onOpenChange,
  onUploaded,
}: UploadFloorPlanDialogProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState<string>("");
  const [floorZone, setFloorZone] = useState<string>("");
  const [netallyUploading, setNetallyUploading] = useState(false);
  const createPlan = useCreateFloorPlan();

  const reset = () => {
    setFile(null);
    setError(null);
    setName("");
    setFloorZone("");
  };

  const handleClose = (next: boolean) => {
    if (createPlan.isPending || netallyUploading) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const handleFile = (selected: File | null) => {
    setError(null);
    if (!selected) {
      setFile(null);
      return;
    }
    const validation = validateFloorPlanFile(selected);
    if (!validation.ok) {
      setFile(null);
      setError(validation.error ?? "Archivo no válido.");
      return;
    }
    setFile(selected);
    if (!name) {
      setName(sanitizeFileName(selected.name));
    }
  };

  const handleSubmit = async () => {
    if (!file) return;
    const finalName = name.trim() || sanitizeFileName(file.name);
    setNetallyUploading(true);
    try {
      let image: string | null = null;
      let width = 0;
      let height = 0;
      let originalFile: string | null = null;
      const fileType = isPdfFile(file) ? ("pdf" as const) : ("image" as const);

      if (fileType === "pdf") {
        originalFile = await readFileAsDataUrl(file);
      } else {
        image = await readFileAsDataUrl(file);
        const dims = await readImageDimensions(file);
        width = dims.width;
        height = dims.height;
      }

      let linkLiveId: string | null = null;
      if (fileType === "image" && width > 0 && height > 0) {
        // NetAlly requiere escala y dimensiones para crear el floor plan.
        // Sin calibración usamos una escala provisional (1px = 0.01ft) que se
        // corregirá al calibrar la escala (paso 2).
        const provisionalPpf = 100;
        const widthFt = Math.round((width / provisionalPpf) * 10) / 10;
        const heightFt = Math.round((height / provisionalPpf) * 10) / 10;
        const imageDataUrl = image ?? "";
        const upload = await uploadFloorPlan({
          imageBase64: imageDataUrl.split(",")[1] ?? imageDataUrl,
          labels: [],
          fileName: file.name,
          floorPlanName: finalName,
          floorPlanWidthPx: width,
          floorPlanHeightPx: height,
          floorPlanScalePpf: provisionalPpf,
          unit: "ft",
          width: widthFt,
          height: heightFt,
        });
        linkLiveId = upload?.id ?? null;
      }

      const plan = await createPlan.mutateAsync({
        name: finalName,
        fileName: file.name,
        mimeType: file.type || "",
        fileType,
        size: file.size,
        floorZone: floorZone.trim() || null,
        linkLiveId,
        image,
        originalFile,
        width,
        height,
      });

      reset();
      onOpenChange(false);
      onUploaded(plan);
      toast.success("Plano subido correctamente");
    } catch (err) {
      toast.error(`Error al subir el plano: ${(err as Error).message}`);
    } finally {
      setNetallyUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Subir plano</DialogTitle>
          <DialogDescription>
            Selecciona una imagen (PNG, JPG/JPEG) o PDF con el plano del edificio.
          </DialogDescription>
        </DialogHeader>

        <label
          htmlFor="floorplan-file"
          className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-6 text-center hover:border-primary/50"
        >
          <UploadCloud className="h-8 w-8 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {file ? (
              <span className="font-medium text-foreground">{file.name}</span>
            ) : (
              <>
                Arrastra un archivo aquí o{" "}
                <span className="text-primary underline">haz clic para elegirlo</span>
              </>
            )}
          </span>
          <input
            id="floorplan-file"
            type="file"
            accept=".png,.jpg,.jpeg,.pdf,image/png,image/jpeg,application/pdf"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>

        {error ? (
          <div className="flex items-start gap-2 rounded-md border border-destructive/40 bg-destructive/10 p-2 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            {error}
          </div>
        ) : null}

        <div className="space-y-3">
          <div>
            <Label htmlFor="floorplan-name">Nombre</Label>
            <Input
              id="floorplan-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Plano planta 1"
            />
          </div>
          <div>
            <Label htmlFor="floorplan-zone">Planta / Zona (opcional)</Label>
            <Input
              id="floorplan-zone"
              value={floorZone}
              onChange={(e) => setFloorZone(e.target.value)}
              placeholder="Ej. Planta 1, Zona A, Exterior…"
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={createPlan.isPending || netallyUploading}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!file || createPlan.isPending || netallyUploading}
          >
            {createPlan.isPending || netallyUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subiendo…
              </>
            ) : (
              "Subir plano"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
