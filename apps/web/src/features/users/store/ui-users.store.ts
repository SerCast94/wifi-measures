import { create } from "zustand";

import { type User } from "@/features/auth/types/user.type";

export interface UiUsersStoreState {
  isOpenModalCreate: boolean;
  isOpenModalUpdate: boolean;
  userToUpdate: User | null;

  setIsOpenModalCreate: (open: boolean) => void;
  openModalUpdate: (user: User) => void;
  closeModalUpdate: () => void;
}

export const useUiUsersStore = create<UiUsersStoreState>((set) => ({
  isOpenModalCreate: false,
  isOpenModalUpdate: false,
  userToUpdate: null,

  setIsOpenModalCreate: (open: boolean) => set({ isOpenModalCreate: open }),
  openModalUpdate: (user: User) =>
    set({ isOpenModalUpdate: true, userToUpdate: user }),
  closeModalUpdate: () => set({ isOpenModalUpdate: false }),
}));
