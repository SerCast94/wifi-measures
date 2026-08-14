import { memo } from "react";

import UserButton from "./UserButton";
import { Button } from "@/core/atomic-components/button";
import { SidebarTrigger } from "@/core/atomic-components/sidebar";

const AppToolbar = () => {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-between px-4 py-1 border-b shadow-sm bg-sidebar">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <SidebarTrigger />
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <UserButton />
      </div>
    </header>
  );
};

export default memo(AppToolbar);
