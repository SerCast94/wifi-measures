import { PencilIcon } from "lucide-react";

import { Button } from "@/core/atomic-components/button";
import { type User } from "@/features/auth/types/user.type";
import { useUiUsersStore } from "../../store/ui-users.store";

interface OpenUpdateUserModalBtnProps {
  user: User;
}

export const OpenUpdateUserModalBtn = ({
  user,
}: OpenUpdateUserModalBtnProps) => {
  const openModal = useUiUsersStore((state) => state.openModalUpdate);

  return (
    <Button
      size="icon"
      aria-label="Editar usuario"
      title="Editar usuario"
      onClick={() => openModal(user)}
    >
      <PencilIcon size={16} />
    </Button>
  );
};
