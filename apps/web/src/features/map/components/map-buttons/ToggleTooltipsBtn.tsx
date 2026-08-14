import { EyeIcon, EyeOffIcon } from "lucide-react";

import { useUiMapStore } from "../../store/ui-map.store";
import { Button } from "@/core/atomic-components/button";

export const ToggleTooltipsBtn = () => {
  const toggle = useUiMapStore((state) => state.toggleTooltipsVisible);
  const isVisible = useUiMapStore((state) => state.tooltipsVisible);

  return (
    <Button
      onClick={toggle}
      size="iconMap"
      variant="map"
      title="Mostrar/Ocultar etiquetas"
      className="map-leaflet-control"
    >
      {isVisible ? <EyeOffIcon size={24} /> : <EyeIcon size={24} />}
    </Button>
  );
};
