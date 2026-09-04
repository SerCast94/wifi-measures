import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/core/atomic-components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/core/atomic-components/dialog";

import { FloorPlanCalibration } from "./FloorPlanCalibration";
import { useUpdateFloorPlan } from "../hooks/use-update-floorplan";
import { useUpdateFloorPlanMeasurements } from "../hooks/use-update-floorplan-measurements";
import type {
  FloorPlan,
  ScaleCalibration,
  ScaleUnit,
} from "../types/floorplan.types";

interface CalibrateScaleDialogProps {
  open: boolean;
  plan: FloorPlan | null;
  onOpenChange: (open: boolean) => void;
}

export const CalibrateScaleDialog = ({
  open,
  plan,
  onOpenChange,
}: CalibrateScaleDialogProps) => {
  const [pending, setPending] = useState(false);
  const update = useUpdateFloorPlan();
  const updateMeasurements = useUpdateFloorPlanMeasurements();

  if (!plan || !plan.image) return null;

  const handleSave = async (data: {
    pixelsPerMeter: number;
    pixelDistance: number;
    realDistance: number;
    unit: ScaleUnit;
    pointA: { x: number; y: number };
    pointB: { x: number; y: number };
  }) => {
    setPending(true);
    try {
      const scale: ScaleCalibration = data;
      await update.mutateAsync({ id: plan.id, payload: { scale } });

      if (plan.linkLiveId) {
        try {
          const FT = 3.28084;
          const ppf = data.pixelsPerMeter > 0 ? data.pixelsPerMeter / FT : 0;
          if (ppf > 0) {
            const widthFt = Math.round((plan.width / ppf) * 100) / 100;
            const heightFt = Math.round((plan.height / ppf) * 100) / 100;
            await updateMeasurements.mutateAsync({
              linkLiveId: plan.linkLiveId,
              floorPlanScalePpf: Math.round(ppf * 100) / 100,
              unit: "ft",
              width: widthFt,
              height: heightFt,
            });
          }
        } catch (err) {
          toast.warning(
            `Escala guardada, pero no se pudo actualizar en NetAlly: ${
              (err as Error).message
            }`
          );
        }
      }

      toast.success("Escala guardada correctamente");
      onOpenChange(false);
    } catch (err) {
      toast.error(`Error al guardar la escala: ${(err as Error).message}`);
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>Calibrar escala — {plan.name}</DialogTitle>
          <DialogDescription>
            Haz clic sobre dos puntos del plano y escribe la distancia real entre
            ellos para calcular la escala.
          </DialogDescription>
        </DialogHeader>

        <FloorPlanCalibration
          image={plan.image}
          naturalWidth={plan.width || 100}
          naturalHeight={plan.height || 100}
          initialScale={plan.scale}
          onSave={handleSave}
        />

        <div className="flex justify-end">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={pending}
          >
            Cancelar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
