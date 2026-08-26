import { RefreshCwIcon, Radar } from "lucide-react";
import { toast } from "sonner";

import { LoadingButton } from "@/core/atomic-components/loading-button";
import { useHasPermission } from "@/core/hooks/useHasPermission";
import { SYNC_MEASURES } from "@/config/constants";
import { useSyncSurveys } from "../hooks/use-sync-surveys";

export const SyncSurveysBtn = () => {
  const canSync = useHasPermission(SYNC_MEASURES);
  const { mutate: syncSurveys, isPending } = useSyncSurveys();

  if (!canSync) return null;

  const handleSync = () => {
    syncSurveys(undefined, {
      onSuccess: (surveys) => {
        toast.success(
          surveys.length > 0
            ? `${surveys.length} mapas de calor sincronizados correctamente`
            : "No hay mapas nuevos que sincronizar"
        );
      },
      onError: (error) => {
        toast.error(`Error al sincronizar mapas: ${error.message}`);
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
          <Radar className="w-4 h-4 sm:mr-2" />
        )
      }
      className="bg-primary text-primary-foreground"
    >
      <span className="hidden sm:flex">Sincronizar Mapas</span>
    </LoadingButton>
  );
};