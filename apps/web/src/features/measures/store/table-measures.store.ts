import { create } from "zustand";

import { sizeOptions } from "../constants/table";

export interface PaginationTable {
  pageIndex: number;
  pageSize: number;
}

export interface TableMeasuresState {
  pagination: PaginationTable;
  globalFilter: string;

  setPagination: (pagination: PaginationTable) => void;
  setGlobalFilter: (filter: string) => void;
}

export const useTableMeasuresStore = create<TableMeasuresState>((set) => ({
  pagination: { pageIndex: 0, pageSize: sizeOptions[0] },
  globalFilter: "",

  setPagination: (pagination: PaginationTable) => set({ pagination }),
  setGlobalFilter: (filter: string) => set({ globalFilter: filter }),
}));
