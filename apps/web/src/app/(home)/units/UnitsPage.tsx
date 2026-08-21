import { Router } from "lucide-react";

import { UnitsTable } from "@/features/netally/components/units/UnitsTable";

const UnitsPage = () => {
  return (
    <div className="w-full px-2 py-2 mx-auto mb-4 sm:px-10 sm:py-6 xl:px-16 xl:py-8 animate-in fade-in-0">
      <div className="flex flex-col items-center justify-between gap-2 mt-2 mb-4 sm:flex-row">
        <h1 className="flex gap-4 px-2 mb-2 text-lg font-bold sm:items-center sm:text-2xl">
          <Router className="w-6 h-6" />
          Unidades NetAlly
        </h1>
      </div>

      <UnitsTable />
    </div>
  );
};

export default UnitsPage;