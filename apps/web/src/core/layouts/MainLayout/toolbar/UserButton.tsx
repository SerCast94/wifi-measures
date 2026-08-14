import { toast } from "sonner";
import { Link } from "react-router";
import { LogOut, UserIcon } from "lucide-react";

import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/core/atomic-components/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/core/atomic-components/dropdown-menu";
import { useLogout } from "@/features/auth/hooks/use-logout";
import { useAuth } from "@/features/auth/providers/AuthProvider";

export const UserButton = () => {
  const { session } = useAuth();
  const { mutate: logout } = useLogout();

  if (!session) {
    return null;
  }

  const handleLogoutBtn = () => {
    logout(undefined, {
      onSuccess: () => {
        toast.success("Logged out successfully");
      },
      onError: (error) => {
        const message = error?.message || "Error logging out";
        toast.error(message, { duration: 5000 });
      },
    });
  };

  const { image, name } = session.user;

  const avatarFallback = name!.charAt(0).toUpperCase();

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger className="relative outline-none">
        <Avatar className="transition rounded-md size-10 hover:opacity-75">
          <AvatarImage className="rounded-md" alt={name} src={image} />
          <AvatarFallback className="text-xs font-bold text-white rounded-md bg-primary text-primary-foreground">
            {avatarFallback}
          </AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" side="bottom" className="w-40">
        <DropdownMenuItem className="h-10 cursor-pointer" asChild>
          <Link to="/profile">
            <UserIcon className="mr-2 size-4" />
            Profile
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={handleLogoutBtn}
          className="h-10 text-red-500 cursor-pointer focus:bg-red-300 dark:focus:bg-red-900 focus:text-foreground"
        >
          <LogOut className="mr-2 size-4" />
          Log Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default UserButton;
