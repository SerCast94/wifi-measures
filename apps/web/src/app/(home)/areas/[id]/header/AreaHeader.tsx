import { ChevronLeftIcon } from "lucide-react";

import { Button } from "@/core/atomic-components/button";
import type { Area } from "@/features/measures/types/areas.types";
import { useBackNavigation } from "@/core/hooks/useBackNavigation";
import { DownloadAreaImagesBtn } from "@/features/measures/components/actions-buttons/DownloadAreaImagesBtn";
import { DownloadAreaReportBtn } from "@/features/measures/components/actions-buttons/DownloadAreaReportBtn";
import { AllCardsCollapsableChannels } from "@/features/measures/components/actions-buttons/AllCardsCollapsableChannels";

interface AreaHeaderProps {
  area: Area;
  activeTab: string;
}

export const AreaHeader = ({ area, activeTab }: AreaHeaderProps) => {
  const goBack = useBackNavigation();

  return (
    <div className="flex flex-col gap-6 px-2">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="hover:bg-transparent hover:opacity-70"
              onClick={goBack}
            >
              <ChevronLeftIcon size={200} />
            </Button>
            <h1 className="text-xl font-bold sm:text-2xl">{area.name}</h1>
          </div>
          <div className="flex gap-2">
            <AllCardsCollapsableChannels activeTab={activeTab} />
            <DownloadAreaImagesBtn
              className="text-white bg-green-800"
              area={area}
            />
            <DownloadAreaReportBtn
              className="text-white bg-primary"
              area={area}
            />
          </div>
        </div>

        <div className="flex gap-2 px-4 sm:items-center text-muted-foreground">
          <span className="font-bold">Provincia: {area.provincia}</span>
        </div>
      </div>
    </div>
  );
};
