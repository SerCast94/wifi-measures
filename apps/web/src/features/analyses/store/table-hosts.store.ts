import { create } from "zustand";
import { type ExpandedState } from "@tanstack/react-table";

import { sizeOptions } from "../constants/table";

export interface PaginationTable {
  pageIndex: number;
  pageSize: number;
}

export interface TableHostsState {
  pagination: PaginationTable;
  globalFilter: string;
  bandFilter: string;
  stateFilter: string;
  expandedRows: ExpandedState;

  setPagination: (pagination: PaginationTable) => void;
  setGlobalFilter: (filter: string) => void;
  setBandFilter: (filter: string) => void;
  setStateFilter: (filter: string) => void;
  setExpandedRows: (expanded: ExpandedState) => void;
  resetExpandedRows: () => void;
}

export const useTableHostsStore = create<TableHostsState>((set) => ({
  pagination: { pageIndex: 0, pageSize: sizeOptions[0] },
  globalFilter: "",
  bandFilter: "all",
  stateFilter: "all",
  expandedRows: {},

  setPagination: (pagination: PaginationTable) => set({ pagination }),
  setGlobalFilter: (filter: string) => set({ globalFilter: filter }),
  setBandFilter: (filter: string) => set({ bandFilter: filter }),
  setStateFilter: (filter: string) => set({ stateFilter: filter }),
  setExpandedRows: (expanded: ExpandedState) => set({ expandedRows: expanded }),
  resetExpandedRows: () => set({ expandedRows: {} }),
}));