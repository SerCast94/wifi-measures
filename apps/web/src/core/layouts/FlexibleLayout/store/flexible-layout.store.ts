import { create } from "zustand";

type LayoutStore = {
  leftPanelVisible: boolean;
  rightPanelVisible: boolean;
  toggleLeftPanel: () => void;
  toggleRightPanel: () => void;
  setLeftPanelVisible: (visible: boolean) => void;
  setRightPanelVisible: (visible: boolean) => void;
};

export const useFlexibleLayoutStore = create<LayoutStore>((set) => ({
  leftPanelVisible: true,
  rightPanelVisible: true,
  toggleLeftPanel: () =>
    set((state) => ({ leftPanelVisible: !state.leftPanelVisible })),
  toggleRightPanel: () =>
    set((state) => ({ rightPanelVisible: !state.rightPanelVisible })),
  setLeftPanelVisible: (visible) => set({ leftPanelVisible: visible }),
  setRightPanelVisible: (visible) => set({ rightPanelVisible: visible }),
}));
