import { useMemo } from "react";

import { TileLayer } from "react-leaflet";

import { MeasureMarker } from "./MeasureMarker";
import { useUiMapStore } from "../../store/ui-map.store";
import { MeasuresStatsPanel } from "./MeasuresStatsPanel";
import { MapMeasuresControls } from "./MapMeasuresControls";
import MarkerClusterGroup from "react-leaflet-markercluster";
import { useMeasuresStore } from "@/features/measures/store/measures.store";

const MapMeasures = () => {
  const measuresIds = useMeasuresStore((state) => state.measuresIds);
  const filteredIds = useMeasuresStore((state) => state.measuresIds);
  // const filteredIds = useMeasuresStore((state) => state.filteredMeasuresIds);
  const markersGrouped = useUiMapStore((state) => state.markersGrouped);

  const measuresMarkers = useMemo(
    () =>
      filteredIds.map((measureId) => (
        <MeasureMarker key={measureId} measureId={measureId} />
      )),
    [filteredIds]
  );

  return (
    <>
      {measuresIds.length > 0 && <MapMeasuresControls />}
      <div className="w-full pointer-events-none absolute z-[999] bottom-[10px] flex flex-col sm:flex-row justify-between sm:items-end gap-2 px-3 py-1">
        {measuresIds.length > 0 && <MeasuresStatsPanel />}
        {/* <MeasuresLastSyncPanel /> */}
      </div>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {markersGrouped ? (
        <MarkerClusterGroup>{measuresMarkers}</MarkerClusterGroup>
      ) : (
        measuresMarkers
      )}
    </>
  );
};

export default MapMeasures;
