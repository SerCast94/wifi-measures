import { ChannelPanel } from "./ChannelPanel";
import type { MeasureChannels } from "../types/measure.types";
import { Separator } from "@/core/atomic-components/separator";

interface ChannelsPopoverProps {
  channels: MeasureChannels;
}

export function ChannelsPanel({ channels }: ChannelsPopoverProps) {
  return (
    <div className="flex flex-col max-w-xs gap-2 p-2 px-4">
      {channels.CHANNEL1 && (
        <>
          <ChannelPanel channel={channels.CHANNEL1} label="Canal 1" />
          <Separator />
        </>
      )}
      {channels.CHANNEL2 && (
        <>
          <ChannelPanel channel={channels.CHANNEL2} label="Canal 2" />
          <Separator />
        </>
      )}
      {channels.CHANNEL3 && (
        <>
          <ChannelPanel channel={channels.CHANNEL3} label="Canal 3" />
          <Separator />
        </>
      )}
      {channels.CHANNEL4 && (
        <>
          <ChannelPanel channel={channels.CHANNEL4} label="Canal 4" />
          <Separator />
        </>
      )}
      {channels.CHANNEL5 && (
        <>
          <ChannelPanel channel={channels.CHANNEL5} label="Canal 5" />
          <Separator />
        </>
      )}
      {channels.CHANNEL6 && (
        <>
          <ChannelPanel channel={channels.CHANNEL6} label="Canal 6" />
          <Separator />
        </>
      )}
      {channels.CHANNEL7 && (
        <>
          <ChannelPanel channel={channels.CHANNEL7} label="Canal 7" />
          <Separator />
        </>
      )}
      {channels.CHANNEL8 && (
        <>
          <ChannelPanel channel={channels.CHANNEL8} label="Canal 8" />
          <Separator />
        </>
      )}
    </div>
  );
}
