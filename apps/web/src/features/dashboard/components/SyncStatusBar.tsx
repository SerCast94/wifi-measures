import { useState } from "react";

import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/core/atomic-components/button";
import { useHasPermission } from "@/core/hooks/useHasPermission";
import { SYNC_MEASURES } from "@/config/constants";
import { useSyncMeasures } from "@/features/measures/hooks/use-sync-measures";
import { useSyncSurveys } from "@/features/surveys/hooks/use-sync-surveys";
import { useSyncAnalyses } from "@/features/analyses/hooks/use-sync-analyses";
import { getLastSync, setLastSync, type SyncSource } from "../lib/last-sync";

const SOURCES: { key: SyncSource; label: string }[] = [
  { key: "measures", label: "Medidas" },
  { key: "surveys", label: "Encuestas" },
  { key: "analyses", label: "Análisis" },
];

const formatDate = (date: Date | null): string => {
  if (!date) return "nunca";
  return date.toLocaleString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const SyncStatusBar = () => {
  const canSync = useHasPermission(SYNC_MEASURES);
  const syncMeasures = useSyncMeasures();
  const syncSurveys = useSyncSurveys();
  const syncAnalyses = useSyncAnalyses();
  const [isSyncing, setIsSyncing] = useState(false);

  if (!canSync) return null;

  const handleSyncAll = async () => {
    setIsSyncing(true);
    let failures = 0;

    const run = async (
      source: SyncSource,
      mutate: (opts: {
        onSuccess: () => void;
        onError: (error: Error) => void;
      }) => void
    ) => {
      await new Promise<void>((resolve) => {
        mutate({
          onSuccess: () => {
            setLastSync(source);
            resolve();
          },
          onError: (error) => {
            failures += 1;
            toast.error(
              `Error al sincronizar ${SOURCES.find((s) => s.key === source)?.label}: ${error.message}`
            );
            resolve();
          },
        });
      });
    };

    await run("measures", (opts) => syncMeasures.mutate(undefined, opts));
    await run("surveys", (opts) => syncSurveys.mutate(undefined, opts));
    await run("analyses", (opts) => syncAnalyses.mutate(undefined, opts));

    setIsSyncing(false);
    if (failures === 0) {
      toast.success("Sincronización completada");
    }
  };

  return (
    <div className="flex flex-col items-start gap-2 sm:flex-row sm:items-center">
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        {SOURCES.map(({ key, label }) => (
          <span key={key}>
            {label}: {formatDate(getLastSync(key))}
          </span>
        ))}
      </div>
      <Button
        variant="outline"
        size="sm"
        onClick={handleSyncAll}
        disabled={isSyncing}
      >
        <RefreshCw
          className={`w-4 h-4 sm:mr-2 ${isSyncing ? "animate-spin" : ""}`}
        />
        <span className="hidden sm:inline">
          {isSyncing ? "Sincronizando…" : "Sincronizar todo"}
        </span>
      </Button>
    </div>
  );
};
