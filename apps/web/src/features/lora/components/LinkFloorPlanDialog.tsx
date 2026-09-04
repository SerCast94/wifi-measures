import { useState } from "react";
import { Link, Unlink, Upload } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/atomic-components/select";
import { useFloorPlansMinimal } from "@/features/floorplans/hooks/use-floorplans";
import { useLinkLoraAuditFloorPlan } from "../hooks/use-lora";
import { UploadFloorPlanDialog } from "@/features/floorplans/components/UploadFloorPlanDialog";
import type { FloorPlan } from "@/features/floorplans/types/floorplan.types";

interface LinkFloorPlanDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  auditId: string;
  currentFloorPlanId: number | null;
  onLinked: (plan: FloorPlan) => void;
}

export const LinkFloorPlanDialog = ({
  open,
  onOpenChange,
  auditId,
  currentFloorPlanId,
  onLinked,
}: LinkFloorPlanDialogProps) => {
  const { data: plans = [] } = useFloorPlansMinimal();
  const linkMutation = useLinkLoraAuditFloorPlan();
  const [selectedId, setSelectedId] = useState<string>(
    currentFloorPlanId?.toString() ?? ""
  );
  const [showUpload, setShowUpload] = useState(false);

  const handleLink = async () => {
    const floorPlanId = selectedId ? Number(selectedId) : null;
    try {
      await linkMutation.mutateAsync({ auditId, floorPlanId });
      const linked = plans.find((p) => p.id === floorPlanId);
      toast.success(
        floorPlanId
          ? `Plano "${linked?.name ?? floorPlanId}" vinculado`
          : "Plano desvinculado"
      );
      onOpenChange(false);
      if (linked) onLinked(linked);
    } catch (err) {
      toast.error(`Error al vincular: ${(err as Error).message}`);
    }
  };

  const handleUnlink = async () => {
    try {
      await linkMutation.mutateAsync({ auditId, floorPlanId: null });
      toast.success("Plano desvinculado");
      onOpenChange(false);
    } catch (err) {
      toast.error(`Error al desvincular: ${(err as Error).message}`);
    }
  };

  const handleUploadDone = (plan: FloorPlan) => {
    setShowUpload(false);
    setSelectedId(plan.id.toString());
    toast.success(`Plano "${plan.name}" creado. Ahora selecciónalo y pulsa Vincular.`);
  };

  return (
    <>
      <Dialog open={open && !showUpload} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular plano a auditoría</DialogTitle>
            <DialogDescription>
              Selecciona un plano existente o sube uno nuevo para usarlo como base
              del mapa de calor.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar plano..." />
              </SelectTrigger>
              <SelectContent>
                {plans.map((plan) => (
                  <SelectItem key={plan.id} value={plan.id.toString()}>
                    {plan.name}
                    {plan.floorZone ? ` (${plan.floorZone})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowUpload(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Subir nuevo plano
            </Button>
          </div>

          <DialogFooter className="flex items-center gap-2">
            {currentFloorPlanId !== null && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleUnlink}
                disabled={linkMutation.isPending}
              >
                <Unlink className="mr-2 h-4 w-4" />
                Desvincular
              </Button>
            )}
            <div className="flex-1" />
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={linkMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              onClick={handleLink}
              disabled={linkMutation.isPending}
            >
              <Link className="mr-2 h-4 w-4" />
              {linkMutation.isPending ? "Vinculando…" : "Vincular"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <UploadFloorPlanDialog
        open={showUpload}
        onOpenChange={setShowUpload}
        onUploaded={handleUploadDone}
      />
    </>
  );
};
