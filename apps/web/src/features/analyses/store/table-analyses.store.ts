import { create } from "zustand";

import { sizeOptions } from "../constants/table";

export interface PaginationTable {
  pageIndex: number;
  pageSize: number;
}

export interface TableAnalysesState {
  pagination: PaginationTable;
  globalFilter: string;
  statusFilter: string;

  setPagination: (pagination: PaginationTable) => void;
  setGlobalFilter: (filter: string) => void;
  setStatusFilter: (filter: string) => void;
}

export const useTableAnalysesStore = create<TableAnalysesState>((set) => ({
  pagination: { pageIndex: 0, pageSize: sizeOptions[0] },
  globalFilter: "",
  statusFilter: "all",

  setPagination: (pagination: PaginationTable) => set({ pagination }),
  setGlobalFilter: (filter: string) => set({ globalFilter: filter }),
  setStatusFilter: (filter: string) => set({ statusFilter: filter }),
}));