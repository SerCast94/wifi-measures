import { create } from "zustand";

import { sizeOptions } from "../constants/table";

export interface PaginationTable {
  pageIndex: number;
  pageSize: number;
}

export interface TableAreasState {
  pagination: PaginationTable;
  globalFilter: string;

  setPagination: (pagination: PaginationTable) => void;
  setGlobalFilter: (filter: string) => void;
}

export const useTableAreasStore = create<TableAreasState>((set) => ({
  pagination: { pageIndex: 0, pageSize: sizeOptions[0] },
  globalFilter: "",

  setPagination: (pagination: PaginationTable) => set({ pagination }),
  setGlobalFilter: (filter: string) => set({ globalFilter: filter }),
}));
