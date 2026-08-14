import { TrashIcon } from "lucide-react";

import { toast } from "sonner";

import { useDeleteUser } from "../../hooks/use-delete-user";
import { LoadingButton } from "@/core/atomic-components/loading-button";
import { useConfirmationModal } from "@/core/providers/ConfirmationModalProvider/ConfirmationModalProvider";

interface DeleteUserBtnProps {
  userId: string;
}

export const DeleteUserBtn = ({ userId }: DeleteUserBtnProps) => {
  const { showModal } = useConfirmationModal();
  const { mutate: deleteUser, isPending: isDeleting } = useDeleteUser();

  const handleDelete = () => {
    showModal({
      title: "Eliminar usuario",
      question: `¿Estás seguro de que quieres eliminar el usuario?`,
      onConfirm: async () =>
        deleteUser(
          { userId },
          {
            onSuccess: () => {
              toast.success("Usuario eliminado correctamente");
            },
            onError: () => {
              toast.error("Error al eliminar el usuario");
            },
          }
        ),
    });
  };

  return (
    <LoadingButton
      size="icon"
      aria-label="Eliminar usuario"
      title="Eliminar usuario"
      disabled={isDeleting}
      loading={isDeleting}
      icon={<TrashIcon size={16} />}
      className="text-white bg-red-600"
      onClick={handleDelete}
    />
  );
};
