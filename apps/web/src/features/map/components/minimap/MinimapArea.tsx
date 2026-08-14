import { useEffect, useMemo } from "react";

import { TileLayer, useMap } from "react-leaflet";

import { MeasureMarker } from "../map/MeasureMarker";
import { useMeasuresStore } from "@/features/measures/store/measures.store";

interface MinimapAreaProps {
  areaId: string;
  selectedMeasureId: number | null;
}

const MinimapArea = ({ areaId, selectedMeasureId }: MinimapAreaProps) => {
  const map = useMap();

  const measures = useMeasuresStore((state) => state.measures);
  const areaMeasures = Object.values(measures).filter(
    (measure) => measure.metadata["ID_AREA"] === +areaId
  );

  const measureMarkers = useMemo(
    () =>
      areaMeasures.map((measure) => (
        <MeasureMarker key={measure.id} measureId={`${measure.id}`} />
      )),
    [areaMeasures]
  );

  if (areaMeasures.length === 1) {
    map.setView(areaMeasures[0].latLng || [0, 0], 15);
  } else if (areaMeasures.length > 1) {
    map.fitBounds(
      areaMeasures.map((measure) => measure.latLng || [0, 0]),
      { padding: [50, 50] }
    );
  }

  useEffect(() => {
    if (selectedMeasureId) {
      const selectedMeasure = areaMeasures.find(
        (measure) => measure.id === selectedMeasureId
      );
      if (selectedMeasure) {
        map.flyTo(selectedMeasure.latLng || [0, 0], 15);
      }
    }
  }, [selectedMeasureId, areaMeasures, map]);

  return (
    <>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {measureMarkers}
    </>
  );
};

export default MinimapArea;
