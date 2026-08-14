import { memo, useEffect } from "react";

import { GlobeIcon, MapIcon, RadioTowerIcon, Users2Icon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

import { cn } from "@/core/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/core/atomic-components/sidebar";
import { MANAGE_USERS } from "@/config/constants";
import { AppSidebarMenuItem } from "./AppSidebarMenuItem";
import { useUser } from "@/features/auth/providers/UserProvider";

export interface MenuItem {
  title: string;
  url: string;
  icon: React.ElementType;
  permissions?: string[];
}

const homeItems: MenuItem[] = [
  {
    title: "Medidas Wi‑Fi",
    url: "/home",
    icon: RadioTowerIcon,
  },
  {
    title: "Áreas Wi‑Fi",
    url: "/areas",
    icon: GlobeIcon,
  },
  {
    title: "Mapa",
    url: "/map",
    icon: MapIcon,
  },
];

const adminItems: MenuItem[] = [
  {
    title: "Usuarios",
    url: "/admin/users",
    icon: Users2Icon,
    permissions: [MANAGE_USERS],
  },
];

function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const location = useLocation();
  const { user } = useUser();
  const { isMobile, setOpenMobile, state } = useSidebar();

  useEffect(() => {
    if (isMobile) setOpenMobile(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <Sidebar collapsible="icon" className="z-20" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              variant={"header"}
              size="lg"
              tooltip="Inicio"
              asChild
            >
              <Link
                to="/"
                className={cn(
                  `flex items-center`,
                  state === "expanded" ? "justify-center" : "m-2.5"
                )}
              >
                <img
                  src={
                    state === "expanded"
                      ? "logo-magtel.webp"
                      : "favicon-32x32.png"
                  }
                  alt="logo"
                  className={
                    state === "expanded" ? "object-cover w-auto h-10" : "h-6"
                  }
                />
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Home</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {homeItems.map((item) => (
                <AppSidebarMenuItem key={item.title} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        {user?.permissions &&
          user?.permissions.some((perm) => perm === MANAGE_USERS) && (
            <>
              <SidebarSeparator />
              <SidebarGroup>
                <SidebarGroupLabel>Administración</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {adminItems.map((item) => (
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
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </>
          )}
      </SidebarContent>
    </Sidebar>
  );
}

export default memo(AppSidebar);
