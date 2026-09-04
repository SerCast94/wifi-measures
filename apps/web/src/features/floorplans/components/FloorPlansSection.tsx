import { useCallback, useState } from "react";
import { Layers } from "lucide-react";

import { Button } from "@/core/atomic-components/button";

import { useFloorPlans } from "../hooks/use-floorplans";
import { isExteriorPlan } from "../types/floorplan.types";
import { FloorPlansGrid } from "./FloorPlansGrid";
import { UploadFloorPlanDialog } from "./UploadFloorPlanDialog";
import type { FloorPlan } from "../types/floorplan.types";

export const FloorPlansSection = () => {
  const { data: plans, isLoading, isError, refetch } = useFloorPlans();
  const [uploadOpen, setUploadOpen] = useState(false);

  const interiorPlans = (plans ?? []).filter((plan) => !isExteriorPlan(plan));

  const handleUploaded = useCallback((plan: FloorPlan) => {
    if (plan.image) {
      setUploadOpen(false);
    }
  }, []);

  return (
    <div className="mt-8">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="flex items-center gap-2 text-base font-bold sm:text-lg">
          <Layers className="h-5 w-5" />
          Planos subidos
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <Button onClick={() => setUploadOpen(true)}>+ Subir plano</Button>
        </div>
      </div>

      <FloorPlansGrid
        plans={interiorPlans}
        isLoading={isLoading}
        isError={isError}
        onRefetch={refetch}
        emptyMessage="No hay planos interiores. Pulsa «+ Subir plano» para añadir uno."
      />

      <UploadFloorPlanDialog
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        onUploaded={handleUploaded}
      />
    </div>
  );
};