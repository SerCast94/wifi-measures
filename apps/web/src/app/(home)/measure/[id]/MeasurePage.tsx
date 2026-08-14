import { FileImage } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";

import { MeasureTabs } from "./tabs/MeasureTabs";
import { MeasureHeader } from "./header/MeasureHeader";
import { Button } from "@/core/atomic-components/button";
import withMeasure from "@/features/measures/components/withMeasure";
import type { MeasureModel } from "@/features/measures/models/measure.model";

interface MeasurePageProps {
  measure: MeasureModel;
}

const MeasurePage = ({ measure }: MeasurePageProps) => {
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsString.withDefault("general")
  );

  return (
    <div className="container max-w-5xl px-2 py-2 mx-auto mb-4 sm:py-6 animate-in fade-in-0">
      {/* Encabezado */}
      <MeasureHeader measure={measure} activeTab={activeTab} />

      {/* Pestañas */}
      <MeasureTabs
        measure={measure}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />

      {/* Botón para mostrar pestaña de imágenes en móvil */}
      <div className="sm:hidden">
        <Button
          variant="outline"
          className="w-full"
          onClick={() => setActiveTab("imagenes")}
        >
          <FileImage className="w-4 h-4 mr-2" />
          Ver Galería de Imágenes
        </Button>
      </div>
    </div>
  );
};

const PageWithMeasure = withMeasure(MeasurePage) as React.FC<
  Omit<MeasurePageProps, "measure">
>;

export default PageWithMeasure;
