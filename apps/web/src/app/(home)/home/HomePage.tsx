import { ClipboardList } from "lucide-react";

import { MeasuresAnalytics } from "@/features/dashboard/components/MeasuresAnalytics";
import { SyncStatusBar } from "@/features/dashboard/components/SyncStatusBar";
import AuditsOverview from "@/features/audits/components/AuditsOverview";
import { NetAllyDashboard } from "@/features/netally/components/dashboard/NetAllyDashboard";

const HomePage = () => {
  return (
    <div className="w-full px-2 py-2 mx-auto mb-4 sm:px-10 sm:py-6 xl:px-16 xl:py-8 animate-in fade-in-0">
      <div className="flex flex-col items-start justify-between gap-2 mt-2 mb-4 sm:flex-row sm:items-center">
        <h1 className="flex gap-4 px-2 mb-2 text-lg font-bold sm:items-center sm:text-2xl">
          <ClipboardList className="w-6 h-6" />
          Auditoría Wi-Fi
        </h1>
        <SyncStatusBar />
      </div>

      <AuditsOverview />

      <div className="mt-8">
        <NetAllyDashboard />
      </div>

      <div className="mt-6">
        <MeasuresAnalytics />
      </div>
    </div>
  );
};

export default HomePage;
