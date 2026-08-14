import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
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
import { getAreasColumns } from "./getAreasColumns";
import { useAreasTable } from "../../hooks/use-areas-table";
import Paginator from "@/core/components/Pagination/Paginator";
import { useTableAreasStore } from "../../store/table-areas.store";
import { PaginationStats } from "@/core/components/Pagination/PaginationStats";
import { PageSizeSelector } from "@/core/components/Pagination/PageSizeSelector";

export const AreasTable = () => {
  const { areas, pagination, setPagination } = useAreasTable();

  const globalFilter = useTableAreasStore((state) => state.globalFilter);
  const setGlobalFilter = useTableAreasStore((state) => state.setGlobalFilter);

  const table = useReactTable({
    data: areas,
    columns: getAreasColumns(),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter,
      pagination,
    },
    onGlobalFilterChange: setGlobalFilter,
    onPaginationChange: (updaterOrValue) => {
      setPagination(
        typeof updaterOrValue === "function"
          ? updaterOrValue(pagination)
          : updaterOrValue
      );
    },
    enableRowSelection: true,
    enableMultiRowSelection: true,
    enableColumnResizing: false,
    manualPagination: false,
    autoResetPageIndex: false,
    columnResizeMode: "onChange",
  });

  return (
    <>
      <div className="border rounded-md">
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
                            : "",
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
                data-state={row.getIsSelected() ? "selected" : undefined}
                className={`cursor-pointer overflow-x-auto ${
                  row.getIsSelected() ? "bg-muted" : ""
                }`}
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
      <div className="flex flex-col items-center justify-between gap-4 py-4 space-x-2 sm:flex-row sm:justify-between mb-14 sm:mb-0">
        <div className="flex flex-col items-center sm:flex-row">
          <PaginationStats
            rowsCount={table.getFilteredRowModel().rows.length}
            selectedRowsCount={table.getFilteredSelectedRowModel().rows.length}
            pageSize={pagination.pageSize}
            pageIndex={pagination.pageIndex}
          />
        </div>
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
