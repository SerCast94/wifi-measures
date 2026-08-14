import { UserPlusIcon } from "lucide-react";

import { toast } from "sonner";

import { useActivateUser } from "../../hooks/use-activate-user";
import { LoadingButton } from "@/core/atomic-components/loading-button";
import { useConfirmationModal } from "@/core/providers/ConfirmationModalProvider/ConfirmationModalProvider";

interface ActivateUserBtnProps {
  userId: string;
}

export const ActivateUserBtn = ({ userId }: ActivateUserBtnProps) => {
  const { showModal } = useConfirmationModal();
  const { mutate: activateUser, isPending: isActivating } = useActivateUser();

  const handleActivate = () => {
    showModal({
      title: "Activar usuario",
      question: `¿Estás seguro de que quieres activar el usuario?`,
      onConfirm: async () =>
        activateUser(
          { userId },
          {
            onSuccess: () => {
              toast.success("Usuario activado correctamente");
            },
            onError: () => {
              toast.error("Error al activar el usuario");
            },
          }
        ),
    });
  };

  return (
    <LoadingButton
      size="icon"
      loading={isActivating}
      disabled={isActivating}
      icon={<UserPlusIcon size={16} />}
      aria-label="Activar usuario"
      title="Activar usuario"
      className="bg-green-600 dark:bg-green-300 text-background"
      onClick={handleActivate}
    />
  );
};
