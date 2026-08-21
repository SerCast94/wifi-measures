import { Separator } from "@/core/atomic-components/separator";
import { Card, CardContent } from "@/core/atomic-components/card";
import type { Area } from "@/features/measures/types/areas.types";
import { GoToMeasureBtn } from "@/features/measures/components/actions-buttons/GoToMeasureBtn";

interface GeneralTabProps {
  area: Area;
}

export const GeneralTab = ({ area }: GeneralTabProps) => {
  return (
    <Card>
      <CardContent className="mt-4 space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-sm font-medium">Área geográfica</p>
            <p className="text-base">{`${area.id} - ${area.name}`}</p>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Provincia</p>
            <p className="text-base">{area.provincia}</p>
          </div>
        </div>
        <Separator />
        <div className="grid grid-cols-1 gap-2">
          {area.measures.length > 0 &&
            area.measures.map((measure, index) => (
              <div
                className="flex items-center justify-between gap-4 rounded-lg p-2 hover:bg-muted"
                key={measure.id}
              >
                <div className="space-y-1">
                  <p className="text-sm font-medium">Medida {index + 1}</p>
                  <p className="text-sm">{measure.name}</p>
                </div>
                <GoToMeasureBtn measureId={`${measure.id}`} />
              </div>
            ))}
          {area.measures.length === 0 && (
            <p className="py-6 text-center text-sm text-muted-foreground">
              No hay medidas registradas en esta área.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
