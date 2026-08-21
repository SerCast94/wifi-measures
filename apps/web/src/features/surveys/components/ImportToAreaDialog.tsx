import { useState } from "react";

import { Import } from "lucide-react";
import { Link } from "react-router";
import { toast } from "sonner";

import { Button } from "@/core/atomic-components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/core/atomic-components/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/core/atomic-components/select";
import { useImportSurveyToArea } from "../hooks/use-import-survey";
import { useMeasuresStore } from "@/features/measures/store/measures.store";
import { useHasPermission } from "@/core/hooks/useHasPermission";
import { MANAGE_MEASURES } from "@/config/constants";
import { useNavigate } from "react-router";

interface ImportToAreaDialogProps {
  surveyId: number;
  surveyName: string | null;
}

export const ImportToAreaDialog = ({
  surveyId,
  surveyName,
}: ImportToAreaDialogProps) => {
  const navigate = useNavigate();
  const canManage = useHasPermission(MANAGE_MEASURES);
  const measures = useMeasuresStore((state) => state.measures);
  const [open, setOpen] = useState(false);
  const [areaId, setAreaId] = useState<string>("");

  const mutation = useImportSurveyToArea(surveyId);

  if (!canManage) return null;

  const areas = Object.values(measures)
    .map((measure) => ({
      id: Number(measure.metadata["ID_AREA"]),
      name: measure.metadata["AREA_GEOGR"] as string,
    }))
    .filter(
      (area, index, self) =>
        !Number.isNaN(area.id) &&
        self.findIndex((a) => a.id === area.id) === index
    )
    .sort((a, b) => a.id - b.id);

  const handleImport = async () => {
    const numericAreaId = Number(areaId);
    if (!Number.isFinite(numericAreaId)) return;

    mutation.mutate(numericAreaId, {
      onSuccess: () => {
        toast.success(
          `Encuesta importada en el área ${numericAreaId} correctamente`
        );
        setOpen(false);
        setAreaId("");
        navigate(`/areas/${numericAreaId}?tab=heatmap`);
      },
      onError: (error) => {
        toast.error(`Error al importar: ${error.message}`);
      },
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Import className="w-4 h-4" />
          Importar a área
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Importar encuesta a un área</DialogTitle>
          <DialogDescription>
            Guarda el plano y el mapa de calor de «{surveyName ?? "la encuesta"}»
            en un área de la app. Al confirmar irás a la pestaña «Mapa de calor»
            del área seleccionada.
          </DialogDescription>
        </DialogHeader>

        {areas.length === 0 ? (
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            No hay áreas disponibles. Las áreas se generan a partir de las
            medidas sincronizadas de Link-Live.{" "}
            <Link to="/areas" className="text-primary underline">
              Ver áreas
            </Link>
          </div>
        ) : (
          <Select value={areaId} onValueChange={setAreaId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecciona un área" />
            </SelectTrigger>
            <SelectContent>
              {areas.map((area) => (
                <SelectItem key={area.id} value={`${area.id}`}>
                  {area.id} · {area.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={mutation.isPending}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleImport}
            disabled={!areaId || mutation.isPending}
          >
            {mutation.isPending ? "Importando…" : "Importar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};