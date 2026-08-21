import { BarChart3, FileImage, Info, Waves } from "lucide-react";

import { GeneralTab } from "./GeneralTab";
import { NetAllyTab } from "./NetAllyTab";
import { GraficasTab } from "./GraficasTab";
import { ArchivosTab } from "./ArchivosTab";
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
            value: "netally",
            label: "NetAlly",
            icon: <Waves className="w-4 h-4" />,
          },
          {
            value: "graficas",
            label: "Gráficas",
            icon: <BarChart3 className="w-4 h-4" />,
          },
          {
            value: "archivos",
            label: "Archivos",
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

      {/* Contenido: NetAlly */}
      <TabsContent
        value="netally"
        className="space-y-4 duration-300 animate-in fade-in-50 slide-in-from-bottom-5"
      >
        <NetAllyTab measure={measure} />
      </TabsContent>

      {/* Contenido: Gráficas */}
      <TabsContent
        value="graficas"
        className="space-y-4 duration-300 animate-in fade-in-50 slide-in-from-bottom-5"
      >
        <GraficasTab measure={measure} />
      </TabsContent>

      {/* Contenido: Archivos */}
      <TabsContent
        value="archivos"
        className="space-y-4 duration-300 animate-in fade-in-50 slide-in-from-bottom-5"
      >
        <ArchivosTab measure={measure} />
      </TabsContent>
    </Tabs>
  );
};