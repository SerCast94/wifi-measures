import { create } from "zustand";

export interface UiProfileStoreState {
  isOpenModalChangePassword: boolean;

  setIsOpenModalChangePassword: (open: boolean) => void;
}

export const useUiProfileStore = create<UiProfileStoreState>((set) => ({
  isOpenModalChangePassword: false,

  setIsOpenModalChangePassword: (open: boolean) =>
    set({ isOpenModalChangePassword: open }),
}));
