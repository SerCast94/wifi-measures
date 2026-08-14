import { FilterIcon } from "lucide-react";

import { Button } from "@/core/atomic-components/button";
import { useFlexibleLayout } from "@/core/layouts/FlexibleLayout/FlexibleLayout";

export const OpenFilterBtn = () => {
  const { setLeftPanelOpen } = useFlexibleLayout();

  const handleToggleOpen = () => {
    setLeftPanelOpen(true);
  };

  return (
    <Button
      onClick={handleToggleOpen}
      size="iconMap"
      variant="map"
      title="Mostrar filtros"
      className="map-leaflet-control"
    >
      <FilterIcon size={24} />
    </Button>
  );
};
