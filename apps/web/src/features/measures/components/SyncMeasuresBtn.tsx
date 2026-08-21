import { RefreshCwIcon } from "lucide-react";

import { LoadingButton } from "@/core/atomic-components/loading-button";
import { useHasPermission } from "@/core/hooks/useHasPermission";
import { SYNC_MEASURES } from "@/config/constants";
import { useSyncMeasures } from "../hooks/use-sync-measures";
import { toast } from "sonner";

export const SyncMeasuresBtn = () => {
  const canSync = useHasPermission(SYNC_MEASURES);
  const { mutate: syncMeasures, isPending: isCreating } = useSyncMeasures();

  if (!canSync) return null;

  const handleSyncMeasures = async () => {
    syncMeasures(undefined, {
      onSuccess: () => {
        toast.success("Medidas sincronizadas correctamente");
      },
      onError: (error) => {
        toast.error(`Error al sincronizar medidas: ${error.message}`);
      },
    });
  };

  return (
    <LoadingButton
      variant="outline"
      size="sm"
      onClick={() => handleSyncMeasures()}
      loading={isCreating}
      icon={<RefreshCwIcon className="w-4 h-4 sm:mr-2" />}
      className="bg-primary text-primary-foreground"
    >
      <span className="hidden sm:flex">Sincronizar Medidas</span>
    </LoadingButton>
  );
};
