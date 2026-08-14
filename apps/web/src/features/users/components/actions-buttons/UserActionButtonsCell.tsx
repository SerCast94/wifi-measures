import { DeleteUserBtn } from "./DeleteUserBtn";
import { ActivateUserBtn } from "./ActivateUserBtn";
import { DeactivateUserBtn } from "./DeactivateUserBtn";
import { type User } from "@/features/auth/types/user.type";
import { useUser } from "@/features/auth/providers/UserProvider";
import { OpenUpdateUserModalBtn } from "./OpenUpdateUserModalBtn";

interface UserActionButtonsCellProps {
  user: User;
}

export const UserActionButtonsCell = ({ user }: UserActionButtonsCellProps) => {
  const { user: authUser } = useUser();
  if (user.id === authUser?.id || user.username === "admin") return null;

  return (
    <div className="flex my-2 space-x-2">
      {user.active ? (
        <>
          <OpenUpdateUserModalBtn user={user} />
          <DeactivateUserBtn userId={user.id} />
        </>
      ) : (
        <ActivateUserBtn userId={user.id} />
      )}
      <DeleteUserBtn userId={user.id} />
    </div>
  );
};
