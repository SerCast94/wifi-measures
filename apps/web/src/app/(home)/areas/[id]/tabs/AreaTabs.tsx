import { Info, FileImage } from "lucide-react";

import { ImagesTab } from "./ImagesTab";
import { GeneralTab } from "./GeneralTab";
import type { Area } from "@/features/measures/types/areas.types";
import { Tabs, TabsContent } from "@/core/atomic-components/tabs";
import { AnimatedTabs } from "@/core/atomic-components/animated-tabs";

interface AreaTabsProps {
  area: Area;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const AreaTabs = ({ area, activeTab, setActiveTab }: AreaTabsProps) => {
  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="w-full mt-4"
    >
      <AnimatedTabs
        tabs={[
          {
            value: "general",
            label: "General",
            icon: <Info className="w-4 h-4" />,
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
        <GeneralTab area={area} />
      </TabsContent>

      {/* Contenido: Imágenes */}
      <TabsContent
        value="imagenes"
        className="space-y-4 duration-300 animate-in fade-in-50 slide-in-from-bottom-5"
      >
        <ImagesTab area={area} />
      </TabsContent>
    </Tabs>
  );
};
