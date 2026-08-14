import { MapContainer, useMap } from "react-leaflet";

import MapMeasures from "./MapMeasures";
import { useMeasures } from "../../hooks/use-measures";

const CurrentMap = () => {
  const map = useMap();
  useMeasures(map);

  return (
    <>
      <MapMeasures />
    </>
  );
};

const MapWrapper = () => {
  return (
    <MapContainer
      className="relative flex-1 h-full"
      center={[0, 0]}
      zoom={2}
      scrollWheelZoom={true}
      zoomAnimation={true}
      zoomAnimationThreshold={4}
      zoomSnap={0.25} // Permite fracciones de zoom
      zoomDelta={0.25} // Cambios de zoom más pequeños
      wheelPxPerZoomLevel={100} // Controla la sensibilidad del scroll
      inertia={true} // Efecto de inercia al hacer scroll
      inertiaDeceleration={3000} // Velocidad de la inercia
    >
      <CurrentMap />
    </MapContainer>
  );
};

export default MapWrapper;
