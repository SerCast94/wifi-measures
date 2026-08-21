import { Activity, RefreshCwIcon } from "lucide-react";
import { toast } from "sonner";

import { LoadingButton } from "@/core/atomic-components/loading-button";
import { useHasPermission } from "@/core/hooks/useHasPermission";
import { SYNC_MEASURES } from "@/config/constants";
import { useSyncAnalyses } from "../hooks/use-sync-analyses";

export const SyncAnalysesBtn = () => {
  const canSync = useHasPermission(SYNC_MEASURES);
  const { mutate: syncAnalyses, isPending } = useSyncAnalyses();

  if (!canSync) return null;

  const handleSync = () => {
    syncAnalyses(undefined, {
      onSuccess: (analyses) => {
        toast.success(
          analyses.length > 0
            ? `${analyses.length} análisis sincronizados correctamente`
            : "No hay análisis nuevos que sincronizar"
        );
      },
      onError: (error) => {
        toast.error(`Error al sincronizar análisis: ${error.message}`);
      },
    });
  };

  return (
    <LoadingButton
      variant="outline"
      size="sm"
      onClick={handleSync}
      loading={isPending}
      icon={
        isPending ? (
          <RefreshCwIcon className="w-4 h-4 sm:mr-2 animate-spin" />
        ) : (
          <Activity className="w-4 h-4 sm:mr-2" />
        )
      }
      className="bg-primary text-primary-foreground"
    >
      <span className="hidden sm:flex">Sincronizar Análisis</span>
    </LoadingButton>
  );
};