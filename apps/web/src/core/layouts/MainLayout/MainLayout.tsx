import { useRef } from "react";

import Cookies from "js-cookie";
import { Outlet } from "react-router-dom";

import { useScrollToTop } from "@/core/hooks/useScrollToTop";
import CustomSuspense from "@/core/components/CustomSuspense";
import { useUILayoutStore } from "@/core/store/ui-layout.store";
import { SidebarProvider } from "@/core/atomic-components/sidebar";
import ProtectedAuth from "@/features/auth/components/ProtectedAuth";
import { UserProvider } from "@/features/auth/providers/UserProvider";
import { ScrollToTopButton } from "@/core/components/ScrollToTopButton";
import { MeasuresProvider } from "@/features/measures/providers/MeasuresProvider";

function Layout() {
  const sidebar = useUILayoutStore((state) => state.sidebar);
  const toolbar = useUILayoutStore((state) => state.toolbar);
  const sidebarStateStore = Cookies.get("sidebar:state");
  const defaultOpen = sidebarStateStore === "true";
  const divRef = useRef<HTMLDivElement>(null);
  const { scrollToTop, showButton, sentinelRef } = useScrollToTop(divRef);

  return (
    <div id="main-layout" className="flex flex-auto w-full">
      <div className="flex flex-auto min-w-0">
        <SidebarProvider defaultOpen={defaultOpen}>
          {sidebar}
          <main className="relative z-10 flex flex-col flex-auto h-auto min-w-0 min-h-full">
            {toolbar}
            <div
              className="relative z-10 flex flex-col flex-auto h-[calc(100dvh_-_49px)] overflow-y-auto overflow-x-hidden"
              ref={divRef}
            >
              <div ref={sentinelRef} className="absolute top-0 w-full h-1" />
              <CustomSuspense>
                <Outlet />
              </CustomSuspense>
              <ScrollToTopButton
                scrollToTop={scrollToTop}
                showButton={showButton}
              />
            </div>
          </main>
        </SidebarProvider>
      </div>
    </div>
  );
}

function MainLayout() {
  return (
    <ProtectedAuth>
      <UserProvider>
        <MeasuresProvider>
          <Layout />
        </MeasuresProvider>
      </UserProvider>
    </ProtectedAuth>
  );
}

export default MainLayout;
