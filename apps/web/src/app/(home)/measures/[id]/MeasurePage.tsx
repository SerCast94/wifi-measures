import { parseAsString, useQueryState } from "nuqs";

import { MeasureTabs } from "./tabs/MeasureTabs";
import { MeasureHeader } from "./header/MeasureHeader";
import withMeasure from "@/features/measures/components/withMeasure";
import type { MeasureModel } from "@/features/measures/models/measure.model";

interface MeasurePageProps {
  measure: MeasureModel;
}

const MeasurePage = ({ measure }: MeasurePageProps) => {
  const [activeTab, setActiveTab] = useQueryState(
    "tab",
    parseAsString.withDefault("general")
  );

  return (
    <div className="container max-w-5xl px-2 py-2 mx-auto mb-4 sm:py-6 animate-in fade-in-0">
      {/* Encabezado */}
      <MeasureHeader measure={measure} />

      {/* Pestañas */}
      <MeasureTabs
        measure={measure}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
      />
    </div>
  );
};

const PageWithMeasure = withMeasure(MeasurePage) as React.FC<
  Omit<MeasurePageProps, "measure">
>;

export default PageWithMeasure;
