import { MapContainer } from "react-leaflet";
import MinimapMeasure from "./MinimapMeasure";

import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import "leaflet/dist/leaflet.css";

interface MinimapWrapperProps {
  measureId: string;
}

const CurrentMinimap = ({ measureId }: MinimapWrapperProps) => {
  return (
    <>
      <MinimapMeasure measureId={measureId} />
    </>
  );
};

const MinimapWrapper = ({ measureId }: MinimapWrapperProps) => {
  return (
    <MapContainer
      className="relative flex-1 h-full"
      center={[0, 0]}
      zoom={20}
      scrollWheelZoom={true}
      zoomAnimation={true}
      zoomAnimationThreshold={4}
      zoomSnap={0.25} // Permite fracciones de zoom
      zoomDelta={0.25} // Cambios de zoom más pequeños
      wheelPxPerZoomLevel={100} // Controla la sensibilidad del scroll
      inertia={true} // Efecto de inercia al hacer scroll
      inertiaDeceleration={3000} // Velocidad de la inercia
    >
      <CurrentMinimap measureId={measureId} />
    </MapContainer>
  );
};

export default MinimapWrapper;
