import React from "react";
import { Pencil, SaveIcon } from "lucide-react";

import { useUser } from "../../providers/UserProvider";
import { Input } from "@/core/atomic-components/input";
import { Button } from "@/core/atomic-components/button";
import { useUpdateAuthUser } from "../../hooks/use-update-auth-user";
import { LoadingButton } from "@/core/atomic-components/loading-button";
import { toast } from "sonner";

export const ProfileNameForm = () => {
  const { user: profileUser } = useUser();
  const [isEditing, setIsEditing] = React.useState(false);
  const [editedName, setEditedName] = React.useState(profileUser.name);
  const { mutate: updateAuthUser, isPending: isUpdating } = useUpdateAuthUser();
  const [error, setError] = React.useState("");

  const handleSaveChanges = () => {
    updateAuthUser(
      { name: editedName },
      {
        onSuccess: () => {
          setIsEditing(false);
          setError("");
          toast.success("Nombre de usuario actualizado");
        },
        onError: () => {
          setError("Ocurrió un error al actualizar el nombre de usuario");
          toast.error("Ocurrió un error al actualizar el nombre de usuario");
        },
      }
    );
  };

  return (
    <>
      {isEditing ? (
        <div className="flex flex-col items-center gap-2 md:ml-40 sm:flex-row">
          <Input
            value={editedName}
            onChange={(e) => setEditedName(e.target.value)}
            className="max-w-[250px]"
            error={error}
            onKeyDown={(e) => e.key === "Enter" && handleSaveChanges()}
          />
          <div className="flex items-center gap-2 mt-2 sm:mt-0">
            <LoadingButton
              size="sm"
              onClick={handleSaveChanges}
              loading={isUpdating}
              icon={<SaveIcon className="w-4 h-4" />}
            >
              Guardar
            </LoadingButton>
            <Button
              size="sm"
              variant="ghost"
              className="text-red-700"
              onClick={() => {
                setIsEditing(false);
                setEditedName(profileUser.name);
              }}
              disabled={isUpdating}
            >
              Cancelar
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center gap-2 md:ml-40 md:justify-start">
          <div className="text-xl md:text-2xl">{profileUser.name}</div>
          <Button
            size="icon"
            variant="ghost"
            className="w-8 h-8"
            onClick={() => setIsEditing(true)}
          >
            <Pencil className="w-4 h-4" />
          </Button>
        </div>
      )}
    </>
  );
};
