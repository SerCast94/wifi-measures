import { useState } from "react";

import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/core/atomic-components/popover";
import { ChannelsPanel } from "./ChannelsPanel";
import { Button } from "@/core/atomic-components/button";
import type { MeasureChannels } from "../types/measure.types";

interface ChannelsPopoverProps {
  channels: MeasureChannels;
}

export function ChannelsPopover({ channels }: ChannelsPopoverProps) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          onClick={() => setOpen((prev) => !prev)}
          className="cursor-pointer"
        >
          CANALES
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align="center"
        side="top"
        className="overflow-y-auto text-sm h-96"
      >
        <ChannelsPanel channels={channels} />
      </PopoverContent>
    </Popover>
  );
}
