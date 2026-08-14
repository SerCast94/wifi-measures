import { Info, User, FileImage, RadioTowerIcon } from "lucide-react";

import { ImagesTab } from "./ImagesTab";
import { FirmasTab } from "./FirmasTab";
import { GeneralTab } from "./GeneralTab";
import { ChannelsTab } from "./ChannelsTab";
import { Tabs, TabsContent } from "@/core/atomic-components/tabs";
import { AnimatedTabs } from "@/core/atomic-components/animated-tabs";
import type { MeasureModel } from "@/features/measures/models/measure.model";

interface MeasureTabsProps {
  measure: MeasureModel;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const MeasureTabs = ({
  measure,
  activeTab,
  setActiveTab,
}: MeasureTabsProps) => {
  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full mt-4 sm:mt-8"
    >
      <AnimatedTabs
        tabs={[
          {
            value: "general",
            label: "General",
            icon: <Info className="w-4 h-4" />,
          },
          {
            value: "channels",
            label: "Canales",
            icon: <RadioTowerIcon className="w-4 h-4" />,
          },
          {
            value: "firmas",
            label: "Firmas",
            icon: <User className="w-4 h-4" />,
          },
          {
            value: "imagenes",
            label: "Imágenes",
            icon: <FileImage className="w-4 h-4" />,
          },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Contenido: Información General */}
      <TabsContent
        value="general"
        className="space-y-4 duration-300 animate-in fade-in-50 slide-in-from-bottom-5"
      >
        <GeneralTab measure={measure} />
      </TabsContent>

      {/* Contenido: Canales */}
      <TabsContent
        value="channels"
        className="space-y-2 duration-300 animate-in fade-in-50 slide-in-from-bottom-5"
      >
        <ChannelsTab channels={measure.channels} measureId={`${measure.id}`} />
      </TabsContent>

      {/* Contenido: Firmas */}
      <TabsContent
        value="firmas"
        className="space-y-4 duration-300 animate-in fade-in-50 slide-in-from-bottom-5"
      >
        <FirmasTab measure={measure} />
      </TabsContent>

      {/* Contenido: Imágenes */}
      <TabsContent
        value="imagenes"
        className="space-y-4 duration-300 animate-in fade-in-50 slide-in-from-bottom-5"
      >
        <ImagesTab measure={measure} />
      </TabsContent>
    </Tabs>
  );
};
