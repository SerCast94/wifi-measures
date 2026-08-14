import { Link, useLocation } from "react-router-dom";

import { type MenuItem } from "./AppSidebar";
import {
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/core/atomic-components/sidebar";
import { useUser } from "@/features/auth/providers/UserProvider";

interface AppSidebarMenuItemProps {
  item: MenuItem;
}

export const AppSidebarMenuItem = ({ item }: AppSidebarMenuItemProps) => {
  const location = useLocation();
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
            location.pathname.includes(item.url)
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
