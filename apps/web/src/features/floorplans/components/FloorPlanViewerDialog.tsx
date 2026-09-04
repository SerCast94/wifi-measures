import { FileText, ZoomIn, ZoomOut } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/core/atomic-components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/core/atomic-components/dialog";

import type { FloorPlan } from "../types/floorplan.types";

interface FloorPlanViewerDialogProps {
  open: boolean;
  plan: FloorPlan | null;
  onOpenChange: (open: boolean) => void;
}

const MIN_ZOOM = 0.2;
const MAX_ZOOM = 5;

export const FloorPlanViewerDialog = ({
  open,
  plan,
  onOpenChange,
}: FloorPlanViewerDialogProps) => {
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    if (open) setZoom(1);
  }, [open]);

  if (!plan) return null;

  const isPdf = plan.fileType === "pdf";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{plan.name}</DialogTitle>
          <DialogDescription>{plan.fileName}</DialogDescription>
        </DialogHeader>

        {isPdf || !plan.image ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border bg-muted/40 p-10 text-center">
            <FileText className="h-12 w-12 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {isPdf
                ? `Documento PDF: ${plan.fileName}`
                : "Este plano no dispone de imagen de previsualización."}
            </p>
            {plan.originalFile && (
              <a
                href={plan.originalFile}
                download={plan.fileName}
                className="text-sm text-primary underline"
              >
                Descargar archivo original
              </a>
            )}
            {isPdf && (
              <p className="text-xs text-muted-foreground">
                Para calibrar la escala necesita una imagen. Convierte la primera
                página del PDF a PNG/JPG y súbela de nuevo.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-1 rounded-md border p-1">
              <span className="px-3 text-xs text-muted-foreground">
                {Math.round(zoom * 100)}%
              </span>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z / 1.2))}
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
              <Button
                type="button"
                size="icon"
                variant="ghost"
                className="h-7 w-7"
                onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z * 1.2))}
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </div>
            <div className="max-h-[70vh] w-full overflow-auto rounded-lg border">
              <img
                src={plan.image}
                alt={plan.name}
                style={{ width: `${zoom * 100}%`, height: "auto" }}
                className="block"
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
