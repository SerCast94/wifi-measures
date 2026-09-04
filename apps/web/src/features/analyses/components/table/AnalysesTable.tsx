import { useState } from "react";
import { useNavigate } from "react-router";

import {
  flexRender,
  getCoreRowModel,
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
import { getAnalysesColumns } from "./getAnalysesColumns";
import { useDeleteAnalysis } from "../../hooks/use-delete-analysis";
import { AnalysesStatusFilter } from "../filters/AnalysesStatusFilter";
import Paginator from "@/core/components/Pagination/Paginator";
import { PaginationStats } from "@/core/components/Pagination/PaginationStats";
import { PageSizeSelector } from "@/core/components/Pagination/PageSizeSelector";
import { useTableAnalysesStore } from "../../store/table-analyses.store";
import type { LinkLiveAnalysis } from "../../types/analysis.types";

interface AnalysesTableProps {
  analyses: LinkLiveAnalysis[];
}

export const AnalysesTable = ({ analyses }: AnalysesTableProps) => {
  const navigate = useNavigate();
  const deleteAnalysis = useDeleteAnalysis();

  const [sorting, setSorting] = useState<SortingState>([]);

  const globalFilter = useTableAnalysesStore((state) => state.globalFilter);
  const setGlobalFilter = useTableAnalysesStore((state) => state.setGlobalFilter);
  const statusFilter = useTableAnalysesStore((state) => state.statusFilter);
  const pagination = useTableAnalysesStore((state) => state.pagination);
  const setPagination = useTableAnalysesStore((state) => state.setPagination);

  const columnFilters: ColumnFiltersState =
    statusFilter === "all" ? [] : [{ id: "status", value: statusFilter }];

  const table = useReactTable({
    data: analyses,
    columns: getAnalysesColumns({
      onDelete: (id) => {
        if (
          window.confirm("¿Seguro que deseas eliminar este análisis?")
        ) {
          deleteAnalysis.mutate(id);
        }
      },
    }),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    globalFilterFn: "includesString",
    state: {
      globalFilter,
      pagination,
      sorting,
      columnFilters,
    },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updaterOrValue) => {
      setPagination(
        typeof updaterOrValue === "function"
          ? updaterOrValue(pagination)
          : updaterOrValue
      );
    },
    onSortingChange: setSorting,
    enableSortingRemoval: true,
    autoResetPageIndex: false,
  });

  const statusOptions = Array.from(
    new Set(analyses.map((analysis) => analysis.status).filter(Boolean))
  ) as string[];

  return (
    <>
      <div className="flex flex-col gap-2 mb-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          {table.getFilteredRowModel().rows.length} de {analyses.length} análisis
        </p>
        <AnalysesStatusFilter options={statusOptions} className="w-full sm:w-48" />
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
              <TableRow
                key={row.id}
                className="cursor-pointer"
                onClick={() => navigate(`/analyses/${row.original.id}`)}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cn(cell.column.columnDef.meta?.className)}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))}
            {table.getRowCount() === 0 && (
              <TableRow>
                <TableCell colSpan={table.getAllColumns().length}>
                  <div className="flex items-center justify-center py-4 text-muted-foreground">
                    No se encontraron resultados
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex flex-col items-center justify-between gap-4 py-4 space-x-2 sm:flex-row sm:justify-between">
        <PaginationStats
          rowsCount={table.getFilteredRowModel().rows.length}
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
    </>
  );
};