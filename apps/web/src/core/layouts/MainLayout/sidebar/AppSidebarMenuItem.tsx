import { Link } from "react-router-dom";

import { type MenuItem } from "./AppSidebar";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/core/atomic-components/sidebar";
import { useUser } from "@/features/auth/providers/UserProvider";

interface AppSidebarMenuItemProps {
  item: MenuItem;
  isActive?: boolean;
}

export const AppSidebarMenuItem = ({
  item,
  isActive = false,
}: AppSidebarMenuItemProps) => {
  const { user } = useUser();

  if (
    !item.permissions ||
    item.permissions?.length === 0 ||
    item.permissions?.some((permission) =>
      user?.permissions?.includes(permission)
    )
  )
    return (
      <SidebarMenuItem key={item.title}>
        <SidebarMenuButton
          tooltip={item.title}
          className={
            isActive
              ? "bg-sidebar-accent text-sidebar-accent-foreground"
              : ""
          }
          asChild
        >
          <Link to={item.url}>
            <item.icon />
            <span>{item.title}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    );

  return null;
};
