import { create } from "zustand";

export interface UiMapState {
  tooltipsVisible: boolean;
  markersGrouped: boolean;

  toggleTooltipsVisible: () => void;
  toggleMarkersGrouped: () => void;
}

export const useUiMapStore = create<UiMapState>((set) => ({
  tooltipsVisible: true,
  markersGrouped: false,

  toggleTooltipsVisible: () =>
    set((state) => ({ tooltipsVisible: !state.tooltipsVisible })),
  toggleMarkersGrouped: () =>
    set((state) => ({ markersGrouped: !state.markersGrouped })),
}));
