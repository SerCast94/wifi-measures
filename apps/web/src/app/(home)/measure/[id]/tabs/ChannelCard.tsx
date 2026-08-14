import { FileText } from "lucide-react";

import type { Channel } from "@/features/measures/types/measure.types";
import CollapsableCard from "@/core/atomic-components/collapsable-card";
import { useUiMeasureStore } from "@/features/measures/store/ui-measure.store";
import ChannelImagesViewer from "@/features/measures/components/image-viewer/ChannelmagesViewer";

interface ChannelCardProps {
  index: number;
  measureId: string;
  channel: Channel;
}

export const ChannelCard = ({
  channel,
  index,
  measureId,
}: ChannelCardProps) => {
  const allCardsOpen = useUiMeasureStore(
    (state) => state.allCollapsableCardsOpen
  );

  return (
    <CollapsableCard
      title={`Canal ${index + 1}`}
      open={allCardsOpen}
      icon={<FileText className="w-5 h-5 mr-2" />}
    >
      <div key={`${channel.channel}`} className="py-2">
        <div className="grid grid-cols-2 gap-x-4 gap-y-2">
          {Object.entries(channel).map(([label, value]) => (
            <div className="flex items-center justify-between" key={label}>
              <span className="font-medium capitalize">{label}</span>
              <span className="text-muted-foreground">
                {value === "" ? "—" : value}
              </span>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-4 mt-6 sm:grid-cols-2 md:grid-cols-3">
          <ChannelImagesViewer
            measureId={measureId}
            channel={
              `c${index + 1}` as
                | "c1"
                | "c2"
                | "c3"
                | "c4"
                | "c5"
                | "c6"
                | "c7"
                | "c8"
            }
            alt={`Foto del Canal ${index + 1}`}
            className="w-full aspect-video"
          />
        </div>
      </div>
    </CollapsableCard>
  );
};
