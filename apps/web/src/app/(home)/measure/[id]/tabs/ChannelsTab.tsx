import { ChannelCard } from "./ChannelCard";
import type { MeasureChannels } from "@/features/measures/types/measure.types";

interface ChannelsTabProps {
  measureId: string;
  channels: MeasureChannels;
}

export const ChannelsTab = ({ channels, measureId }: ChannelsTabProps) => {
  return (
    <>
      {Object.entries(channels).map(([key, channel], index) => (
        <ChannelCard
          key={key}
          channel={channel}
          index={index}
          measureId={measureId}
        />
      ))}
    </>
  );
};
