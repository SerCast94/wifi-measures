import { create } from "zustand";
import AppSidebar from "@/core/layouts/MainLayout/sidebar/AppSidebar";
import AppToolbar from "../layouts/MainLayout/toolbar/AppToolbar";

export interface LayoutStore {
  sidebar: React.ReactNode;
  toolbar: React.ReactNode;

  setSidebar: (sidebar: React.ReactNode) => void;
  setToolbar: (toolbar: React.ReactNode) => void;
  resetSidebar: () => void;
  resetToolbar: () => void;
  resetLayout: () => void;
}

export const useUILayoutStore = create<LayoutStore>((set) => ({
  sidebar: <AppSidebar />,
  toolbar: <AppToolbar />,

  setSidebar: (sidebar: React.ReactNode) => set({ sidebar: sidebar }),
  setToolbar: (toolbar: React.ReactNode) => set({ toolbar: toolbar }),
  resetSidebar: () => set({ sidebar: <AppSidebar /> }),
  resetToolbar: () => set({ toolbar: <AppToolbar /> }),
  resetLayout: () => {
    set({ sidebar: <AppSidebar /> });
    set({ toolbar: <AppToolbar /> });
  },
}));
