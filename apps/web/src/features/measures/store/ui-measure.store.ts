import { create } from "zustand";

export interface UiMeasureState {
  allCollapsableCardsOpen: boolean;
  setAllCollapsableCardsOpen: (open: boolean) => void;
  toggleAllCollapsableCardsOpen: () => void;
}

export const useUiMeasureStore = create<UiMeasureState>((set) => ({
  allCollapsableCardsOpen: false,
  setAllCollapsableCardsOpen: (open: boolean) =>
    set({ allCollapsableCardsOpen: open }),
  toggleAllCollapsableCardsOpen: () =>
    set((state) => ({
      allCollapsableCardsOpen: !state.allCollapsableCardsOpen,
    })),
}));
