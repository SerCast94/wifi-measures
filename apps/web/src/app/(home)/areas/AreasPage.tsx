import { RadioTowerIcon } from "lucide-react";

import { AreasTable } from "@/features/measures/components/table/AreasTable";
import { SyncMeasuresBtn } from "@/features/measures/components/SyncMeasuresBtn";
import { GlobalAreasFilter } from "@/features/measures/components/filters/GlobalAreasFilter";

const AreasPage = () => {
  return (
    <div className="w-full px-2 py-2 mx-auto mb-4 sm:px-10 sm:py-6 xl:px-16 xl:py-8 animate-in fade-in-0">
      <div className="flex flex-col items-center justify-between gap-2 mt-2 mb-4 sm:flex-row">
        <h1 className="flex gap-4 px-2 mb-2 text-lg font-bold sm:items-center sm:text-2xl">
          <RadioTowerIcon className="w-6 h-6" />
          Gestión de Áreas Wi‑Fi
        </h1>
        <div className="flex items-center gap-2">
          <SyncMeasuresBtn />
          <GlobalAreasFilter className="w-full sm:w-64" />
        </div>
      </div>

      <AreasTable />
    </div>
  );
};

export default AreasPage;
