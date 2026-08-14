import { ShieldIcon } from "lucide-react";

import { Button } from "@/core/atomic-components/button";
import { useUiProfileStore } from "@/features/auth/store/ui-profile.store";

export const OpenChangePasswordModalBtn = () => {
  const { setIsOpenModalChangePassword } = useUiProfileStore();

  return (
    <Button
      className="text-white bg-green-700"
      onClick={() => setIsOpenModalChangePassword(true)}
    >
      <ShieldIcon className="w-4 h-4" />
      Cambiar contraseña
    </Button>
  );
};
