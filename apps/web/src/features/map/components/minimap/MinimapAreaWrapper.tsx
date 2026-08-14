import { MapContainer } from "react-leaflet";

import MinimapArea from "./MinimapArea";

import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import "leaflet/dist/leaflet.css";

interface MinimapWrapperProps {
  areaId: string;
  selectedMeasureId: number | null;
}

const CurrentAreaMinimap = ({
  areaId,
  selectedMeasureId,
}: MinimapWrapperProps) => {
  return (
    <>
      <MinimapArea areaId={areaId} selectedMeasureId={selectedMeasureId} />
    </>
  );
};

const MinimapAreaWrapper = ({
  areaId,
  selectedMeasureId,
}: MinimapWrapperProps) => {
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
      <CurrentAreaMinimap
        areaId={areaId}
        selectedMeasureId={selectedMeasureId}
      />
    </MapContainer>
  );
};

export default MinimapAreaWrapper;
