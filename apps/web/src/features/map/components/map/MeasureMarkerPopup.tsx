import { memo, useMemo } from "react";

import { Popup } from "react-leaflet";

import type { MeasureModel } from "@/features/measures/models/measure.model";
import { ChannelsPanel } from "@/features/measures/components/ChannelsPanel";

interface MeasureMarkerPopupProps {
  measure: MeasureModel;
}

export const MeasureMarkerPopup = memo(
  ({ measure }: MeasureMarkerPopupProps) => {
    const data = useMemo(() => measure.getPopupData(), [measure]);

    return (
      <Popup>
        <div className="flex flex-col p-6 bg-background">
          <h3 className="text-base font-semibold text-center">{data.name}</h3>

          <div className="mt-1 mb-2 text-xs text-center text-gray-600 dark:text-gray-400">
            <strong>Coordenadas:</strong> [{data.latitude.toFixed(6)},{" "}
            {data.longitude.toFixed(6)}]
          </div>

          <div className="pt-2 space-y-1 text-xs border-t border-gray-300 dark:border-gray-700">
            {Object.entries(data.metadata).map(([key, value]) => (
              <div key={key}>
                <span className="font-semibold">{key.toUpperCase()}:</span>{" "}
                {value}
              </div>
            ))}
          </div>
          <div className="mt-2 overflow-y-auto text-xs border-t border-gray-300 h-96">
            {measure.channels && <ChannelsPanel channels={measure.channels} />}
          </div>
        </div>
      </Popup>
    );
  }
);
