import { GroupIcon, UngroupIcon } from "lucide-react";

import { Button } from "@/core/atomic-components/button";
import { useUiMapStore } from "../../store/ui-map.store";

export const ToggleClusterBtn = () => {
  const markersGrouped = useUiMapStore((state) => state.markersGrouped);
  const toggleMarkersGrouped = useUiMapStore(
    (state) => state.toggleMarkersGrouped
  );

  return (
    <Button
      onClick={toggleMarkersGrouped}
      size="iconMap"
      variant="map"
      title="Agrupar/Desagrupar Medidas"
      className="map-leaflet-control"
    >
      {markersGrouped ? <UngroupIcon size={24} /> : <GroupIcon size={24} />}
    </Button>
  );
};
