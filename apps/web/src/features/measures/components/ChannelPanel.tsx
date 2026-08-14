import type { Channel } from "../types/measure.types";

interface ChannelPanelProps {
  label: string;
  channel: Channel;
}

export function ChannelPanel({ label, channel }: ChannelPanelProps) {
  return (
    <div className="flex flex-col">
      <h3 className="mb-3 text-sm font-semibold">{label}</h3>
      <div className="grid grid-cols-2 text-xs gap-x-4 gap-y-2">
        {Object.entries(channel).map(([label, value]) => (
          <div className="flex items-center justify-between" key={label}>
            <span className="font-medium capitalize">{label}</span>
            <span className="text-muted-foreground">{value ?? "—"}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
