import { PlusIcon } from "lucide-react";

import { Button } from "@/core/atomic-components/button";
import { useUiUsersStore } from "../../store/ui-users.store";

export const OpenCreateUserModalBtn = () => {
  const setIsOpen = useUiUsersStore((state) => state.setIsOpenModalCreate);

  return (
    <Button
      className="text-white bg-green-700"
      onClick={() => setIsOpen(true)}
      title="Crear usuario"
    >
      <PlusIcon className="w-6 h-6" />
      <span className="hidden sm:block">Crear Usuario</span>
    </Button>
  );
};
