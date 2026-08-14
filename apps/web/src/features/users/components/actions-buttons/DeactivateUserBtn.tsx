import { UserMinusIcon } from "lucide-react";

import { toast } from "sonner";

import { useDeactivateUser } from "../../hooks/use-deactivate-user";
import { LoadingButton } from "@/core/atomic-components/loading-button";
import { useConfirmationModal } from "@/core/providers/ConfirmationModalProvider/ConfirmationModalProvider";

interface DeactivateUserBtnProps {
  userId: string;
}

export const DeactivateUserBtn = ({ userId }: DeactivateUserBtnProps) => {
  const { showModal } = useConfirmationModal();
  const { mutate: deactivateUser, isPending: isDeactivating } =
    useDeactivateUser();

  const handleDeactivate = () => {
    showModal({
      title: "Desactivar usuario",
      question: `¿Estás seguro de que quieres desactivar el usuario?`,
      onConfirm: async () =>
        deactivateUser(
          { userId },
          {
            onSuccess: () => {
              toast.success("Usuario desactivado correctamente");
            },
            onError: () => {
              toast.error("Error al desactivar el usuario");
            },
          }
        ),
    });
  };

  return (
    <LoadingButton
      size="icon"
      aria-label="Desactivar usuario"
      title="Desactivar usuario"
      disabled={isDeactivating}
      loading={isDeactivating}
      icon={<UserMinusIcon size={16} />}
      className="bg-blue-600 dark:bg-blue-300 text-background"
      onClick={handleDeactivate}
    />
  );
};
