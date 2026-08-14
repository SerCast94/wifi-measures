import { Tooltip } from "react-leaflet";
import { useUiMapStore } from "../../store/ui-map.store";

interface CentroMarkerTooltipProps {
  name: string;
}

export const MeasureMarkerTooltip = ({ name }: CentroMarkerTooltipProps) => {
  const tooltipsVisible = useUiMapStore((state) => state.tooltipsVisible);

  return (
    <Tooltip
      key={name + "-tooltip" + tooltipsVisible}
      direction="bottom"
      offset={[0, 10]}
      permanent={tooltipsVisible}
    >
      <span className="font-semibold">{name}</span>
    </Tooltip>
  );
};
