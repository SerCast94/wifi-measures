import { User } from "lucide-react";

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/core/atomic-components/card";
import type { MeasureModel } from "@/features/measures/models/measure.model";
import FirmaImageViewer from "@/features/measures/components/image-viewer/FirmaImageViewer";

interface FirmasTabProps {
  measure: MeasureModel;
}

export const FirmasTab = ({ measure }: FirmasTabProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <User className="w-5 h-5 mr-2" />
          Firma
        </CardTitle>
        <CardDescription>Firma del técnico</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6">
          {/* Firma Técnico */}
          <div className="space-y-2">
            <p className="text-sm font-medium">Nombre:</p>
            <p>{measure.technician || "-"}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">DNI:</p>
            <p>{measure.dniTechnician || "-"}</p>
          </div>
          <div className="space-y-2">
            <p className="text-sm font-medium">Firma:</p>
            <FirmaImageViewer
              measureId={`${measure.id}`}
              alt="Firma del Técnico"
              description={`Firma del técnico ${measure.technician}`}
              className="w-full max-w-lg aspect-video"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
