import { useMemo } from "react";

import { TileLayer, useMap } from "react-leaflet";

import { MeasureMarker } from "../map/MeasureMarker";
import { useMeasuresStore } from "@/features/measures/store/measures.store";

interface MinimapMeasureProps {
  measureId: string;
}

const MinimapMeasure = ({ measureId }: MinimapMeasureProps) => {
  const map = useMap();

  const measure = useMeasuresStore((state) => state.measures[measureId]);
  map.setView(measure?.latLng || [0, 0], 15);

  const measureMarker = useMemo(
    () => <MeasureMarker key={measureId} measureId={measureId} />,
    [measureId]
  );

  return (
    <>
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
      {measureMarker}
    </>
  );
};

export default MinimapMeasure;
