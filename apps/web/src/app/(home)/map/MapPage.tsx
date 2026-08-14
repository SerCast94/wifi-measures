import { MapLayout } from "@/features/map/layouts/MapLayout";
import MapWrapper from "@/features/map/components/map/MapWrapper";

import "leaflet.markercluster/dist/MarkerCluster.css";
import "leaflet.markercluster/dist/MarkerCluster.Default.css";

import "leaflet/dist/leaflet.css";

const MapPage = () => {
  return (
    <MapLayout>
      <MapWrapper />
    </MapLayout>
  );
};

export default MapPage;
