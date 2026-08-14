import { FileImage } from "lucide-react";
import { parseAsString, useQueryState } from "nuqs";

import { AreaTabs } from "./tabs/AreaTabs";
import { AreaHeader } from "./header/AreaHeader";
import { Button } from "@/core/atomic-components/button";
import withArea from "@/features/measures/components/withArea";
import type { Area } from "@/features/measures/types/areas.types";

interface AreaPageProps {
  area: Area;
}

const AreaPage = ({ area }: AreaPageProps) => {
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsString.withDefault("general")
  );

  return (
    <div className="container max-w-5xl px-2 py-2 mx-auto mb-4 sm:py-6 animate-in fade-in-0">
      {/* Encabezado */}
      <AreaHeader area={area} activeTab={activeTab} />

      {/* Pestañas */}
      <AreaTabs area={area} activeTab={activeTab} setActiveTab={setActiveTab} />

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

const PageWithArea = withArea(AreaPage) as React.FC<
  Omit<AreaPageProps, "area">
>;

export default PageWithArea;
