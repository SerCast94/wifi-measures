import L from "leaflet";
import { Marker } from "react-leaflet";

import { DEFAULT_ICONMARKER } from "../../constants/map";
import { MeasureMarkerPopup } from "./MeasureMarkerPopup";
import { MeasureMarkerTooltip } from "./MeasureMarkerTooltip";
import { useMeasuresStore } from "@/features/measures/store/measures.store";

interface MeasureMarkerProps {
  measureId: string;
}

export const MeasureMarker = ({ measureId }: MeasureMarkerProps) => {
  const measure = useMeasuresStore((state) => state.measures[measureId]);
  if (!measure) return null;

  return (
    <Marker
      position={[measure.latitude, measure.longitude]}
      icon={L.icon({
        iconUrl: DEFAULT_ICONMARKER,
        iconSize: [30, 30],
      })}
    >
      <MeasureMarkerPopup measure={measure} />
      <MeasureMarkerTooltip
        name={`${measure.metadata["AREA_GEOGR"]} P${measure.metadata["PTO_MEDIDA"]}-M${measure.metadata["N_MEDIDA"]}`}
      />
    </Marker>
  );
};
