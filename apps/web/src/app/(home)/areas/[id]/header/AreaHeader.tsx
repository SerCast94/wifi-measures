import { Link } from "react-router";
import { FileText } from "lucide-react";

import { Button } from "@/core/atomic-components/button";
import { Breadcrumbs } from "@/core/components/Breadcrumbs";
import type { Area } from "@/features/measures/types/areas.types";

interface AreaHeaderProps {
  area: Area;
}

export const AreaHeader = ({ area }: AreaHeaderProps) => {
  return (
    <div className="flex flex-col gap-4 px-2">
      <div className="flex flex-col gap-2">
        <Breadcrumbs
          items={[{ label: "Áreas", to: "/areas" }, { label: area.name }]}
        />
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="px-4 text-xl font-bold sm:text-2xl">{area.name}</h1>
          <div className="flex gap-2 px-4 sm:px-0">
            <Button asChild size="sm" className="text-white bg-blue-700">
              <Link to={`/areas/${area.id}/reporte`}>
                <FileText className="w-4 h-4 mr-2" />
                Informe completo
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex gap-2 px-4 sm:items-center text-muted-foreground">
          <span className="font-bold">Provincia: {area.provincia}</span>
        </div>
      </div>
    </div>
  );
};
