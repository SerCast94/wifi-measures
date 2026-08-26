import { Fragment, useEffect, useState } from "react";

import {
  flexRender,
  getCoreRowModel,
  getExpandedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnFiltersState,
  type SortingState,
} from "@tanstack/react-table";
import { ChevronUp, ChevronDown } from "lucide-react";

import { cn } from "@/core/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/atomic-components/table";
import { sizeOptions } from "../../constants/table";
import { getHostColumns } from "./getHostColumns";
import { HostDetailPanel } from "./HostDetailPanel";
import { GlobalHostsFilter } from "../filters/GlobalHostsFilter";
import { HostsBandFilter } from "../filters/HostsBandFilter";
import { HostsStateFilter } from "../filters/HostsStateFilter";
import Paginator from "@/core/components/Pagination/Paginator";
import { PaginationStats } from "@/core/components/Pagination/PaginationStats";
import { PageSizeSelector } from "@/core/components/Pagination/PageSizeSelector";
import { useTableHostsStore } from "../../store/table-hosts.store";
import type { AnalysisHost } from "../../types/analysis.types";

interface HostsTableProps {
  hostType: string;
  hosts: AnalysisHost[];
  /** anula la paginación del store (informe: mostrar todos) */
  pageSize?: number;
}

export const HostsTable = ({ hostType, hosts, pageSize: pageSizeProp }: HostsTableProps) => {
  const [sorting, setSorting] = useState<SortingState>([]);

  const pagination = useTableHostsStore((state) => state.pagination);
  const setPagination = useTableHostsStore((state) => state.setPagination);
  const globalFilter = useTableHostsStore((state) => state.globalFilter);
  const setGlobalFilter = useTableHostsStore((state) => state.setGlobalFilter);
  const bandFilter = useTableHostsStore((state) => state.bandFilter);
  const stateFilter = useTableHostsStore((state) => state.stateFilter);
  const expandedRows = useTableHostsStore((state) => state.expandedRows);
  const setExpandedRows = useTableHostsStore((state) => state.setExpandedRows);
  const resetExpandedRows = useTableHostsStore((state) => state.resetExpandedRows);

  useEffect(() => {
    setSorting([]);
    setPagination({ pageIndex: 0, pageSize: pagination.pageSize });
    resetExpandedRows();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hostType]);

  const columnFilters: ColumnFiltersState = [];
  if (bandFilter !== "all") columnFilters.push({ id: "band", value: bandFilter });
  if (stateFilter !== "all")
    columnFilters.push({
      id: "inactive",
      value: stateFilter === "inactive",
    });

  const table = useReactTable({
    data: hosts,
    columns: getHostColumns(hostType),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    globalFilterFn: "includesString",
    state: {
      sorting,
      pagination: pageSizeProp
        ? { pageIndex: 0, pageSize: pageSizeProp }
        : pagination,
      globalFilter,
      columnFilters,
      expanded: expandedRows,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: (updaterOrValue) => {
      setExpandedRows(
        typeof updaterOrValue === "function"
          ? updaterOrValue(expandedRows)
          : updaterOrValue
      );
    },
    onPaginationChange: (updaterOrValue) => {
      setPagination(
        typeof updaterOrValue === "function"
          ? updaterOrValue(pagination)
          : updaterOrValue
      );
    },
    enableSortingRemoval: true,
    autoResetPageIndex: false,
  });

  const filteredCount = table.getFilteredRowModel().rows.length;

  useEffect(() => {
    const lastPageIndex = Math.max(
      0,
      Math.ceil(filteredCount / pagination.pageSize) - 1
    );
    if (pagination.pageIndex > lastPageIndex) {
      setPagination({
        pageIndex: lastPageIndex,
        pageSize: pagination.pageSize,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredCount, globalFilter, bandFilter, stateFilter, hosts]);

  const bandOptions = Array.from(
    new Set(hosts.map((host) => host.band).filter(Boolean))
  ) as string[];

  const leafColumnCount = table.getAllLeafColumns().length;

  return (
    <>
      <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <GlobalHostsFilter className="w-full sm:w-64" />
          <HostsBandFilter options={bandOptions} className="w-full sm:w-40" />
          <HostsStateFilter className="w-full sm:w-44" />
        </div>
        <p className="text-sm text-muted-foreground">
          {filteredCount} de {hosts.length} dispositivos
        </p>
      </div>

      <div className="border rounded-md [&_table]:table-fixed [&_td]:px-2 [&_th]:px-2">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
                      header.column.columnDef.meta?.className,
                      "text-foreground"
                    )}
                  >
                    {header.isPlaceholder ? null : (
                      <div
                        {...{
                          className: header.column.getCanSort()
                            ? "cursor-pointer select-none flex items-center"
                            : "flex items-center",
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                        {{
                          asc: <ChevronUp className="w-4 h-4 ml-2" />,
                          desc: <ChevronDown className="w-4 h-4 ml-2" />,
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.map((row) => (
              <Fragment key={row.id}>
                <TableRow data-state={row.getIsExpanded() ? "selected" : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(cell.column.columnDef.meta?.className)}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
                {row.getIsExpanded() && (
                  <TableRow className="hover:bg-background">
                    <TableCell
                      colSpan={leafColumnCount}
                      className="bg-muted/30 !px-4 !py-3"
                    >
                      <HostDetailPanel host={row.original} />
                    </TableCell>
                  </TableRow>
                )}
              </Fragment>
            ))}
            {table.getRowCount() === 0 && (
              <TableRow>
                <TableCell colSpan={leafColumnCount}>
                  <div className="flex items-center justify-center py-4 text-muted-foreground">
                    No se encontraron resultados
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      {!pageSizeProp ? (
      <div className="flex flex-col items-center justify-between gap-4 py-4 space-x-2 sm:flex-row sm:justify-between">
        <PaginationStats
          rowsCount={filteredCount}
          selectedRowsCount={0}
          pageSize={pagination.pageSize}
          pageIndex={pagination.pageIndex}
        />
        <div className="flex flex-col items-center gap-4 sm:flex-row">
          <PageSizeSelector
            pageSize={pagination.pageSize}
            setPageSize={(pageSize: number) => table.setPageSize(pageSize)}
            options={sizeOptions}
          />
          <Paginator
            currentPage={pagination.pageIndex + 1}
            totalPages={table.getPageCount()}
            onPageChange={(pageNumber) => table.setPageIndex(pageNumber - 1)}
            showPreviousNext
          />
        </div>
      </div>
      ) : null}
    </>
  );
};