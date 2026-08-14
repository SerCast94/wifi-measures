import { memo } from "react";

// import { OpenFilterBtn } from "../map-buttons/OpenFilterBtn";
import { ToggleClusterBtn } from "../map-buttons/ToggleClusterBtn";
import { ToggleTooltipsBtn } from "../map-buttons/ToggleTooltipsBtn";

export const MapMeasuresControls = memo(() => {
  return (
    <div className="absolute z-[999] top-[10px] left-[52px] flex items-center gap-2">
      {/* <OpenFilterBtn /> */}
      <ToggleTooltipsBtn />
      <ToggleClusterBtn />
    </div>
  );
});
