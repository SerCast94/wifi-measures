import { memo, useEffect } from "react";

import {
  Activity,
  ClipboardCheckIcon,
  Radar,
  RadioTowerIcon,
  Router,
  Users2Icon,
  PaperclipIcon,
} from "lucide-react";
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

const auditItems: MenuItem[] = [
  {
    title: "Auditorías",
    url: "/audits",
    icon: ClipboardCheckIcon,
  },
  {
    title: "Medidas",
    url: "/measures",
    icon: RadioTowerIcon,
  },
  {
    title: "Mapas de calor",
    url: "/surveys",
    icon: Radar,
  },
  {
    title: "Análisis",
    url: "/analyses",
    icon: Activity,
  },
  {
    title: "Archivos",
    url: "/files",
    icon: PaperclipIcon,
  },
];

const managementItems: MenuItem[] = [
  {
    title: "Unidades",
    url: "/units",
    icon: Router,
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
          <SidebarGroupLabel>Auditoría Wi-Fi</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {auditItems.map((item) => (
                <AppSidebarMenuItem key={item.title} item={item} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
        <SidebarSeparator />
        <SidebarGroup>
          <SidebarGroupLabel>Gestión</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {managementItems.map((item) => (
                <AppSidebarMenuItem key={item.title} item={item} />
              ))}
              {user?.permissions &&
                user?.permissions.some((perm) => perm === MANAGE_USERS) &&
                adminItems.map((item) => (
                  <AppSidebarMenuItem key={item.title} item={item} />
                ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

export default memo(AppSidebar);
