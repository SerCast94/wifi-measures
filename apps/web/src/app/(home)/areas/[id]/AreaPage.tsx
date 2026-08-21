import { parseAsString, useQueryState } from "nuqs";

import { AreaTabs } from "./tabs/AreaTabs";
import { AreaHeader } from "./header/AreaHeader";
import withArea from "@/features/measures/components/withArea";
import type { Area } from "@/features/measures/types/areas.types";

interface AreaPageProps {
  area: Area;
}

const AreaPage = ({ area }: AreaPageProps) => {
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsString.withDefault("general")
  );

  return (
    <div className="container max-w-5xl px-2 py-2 mx-auto mb-4 sm:py-6 animate-in fade-in-0">
      {/* Encabezado */}
      <AreaHeader area={area} />

      {/* Pestañas */}
      <AreaTabs area={area} activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
};

const PageWithArea = withArea(AreaPage) as React.FC<
  Omit<AreaPageProps, "area">
>;

export default PageWithArea;
