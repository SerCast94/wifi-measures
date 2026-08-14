import { create } from "zustand";
import { type RowSelectionState } from "@tanstack/react-table";

import { sizeOptions } from "../constants/table";

export interface PaginationTable {
  pageIndex: number;
  pageSize: number;
}

export interface TableUsersState {
  pagination: PaginationTable;
  selectedRowsState: RowSelectionState;
  globalFilter: string;
  selectedIds: string[];

  setPagination: (pagination: PaginationTable) => void;
  setSelectedRowsState: (selectedRowsState: RowSelectionState) => void;
  resetSelectedRowsState: () => void;
  setSelectedIds: (selectedIds: string[]) => void;
  setGlobalFilter: (filter: string) => void;
}

export const useTableUsersStore = create<TableUsersState>((set) => ({
  pagination: { pageIndex: 0, pageSize: sizeOptions[0] },
  selectedRowsState: {} as RowSelectionState,
  globalFilter: "",
  selectedIds: [],

  setPagination: (pagination: PaginationTable) => set({ pagination }),
  setSelectedRowsState: (selectedRowsState: RowSelectionState) => {
    set({ selectedRowsState });
  },
  resetSelectedRowsState: () => set({ selectedRowsState: {} }),
  setSelectedIds: (selectedIds: string[]) => set({ selectedIds }),
  setGlobalFilter: (filter: string) => set({ globalFilter: filter }),
}));
