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
import { getUsersColumns } from "./getUsersColumns";
import { useUsersTable } from "../../hooks/use-users-table";
import Paginator from "@/core/components/Pagination/Paginator";
import { useTableUsersStore } from "../../store/table-users.store";
import { PaginationStats } from "@/core/components/Pagination/PaginationStats";
import { PageSizeSelector } from "@/core/components/Pagination/PageSizeSelector";
import { useRoles } from "../../providers/RolesProvider";

export const UsersTable = () => {
  const { usersOrdered, pagination, setPagination } = useUsersTable();
  const { roles } = useRoles();

  const globalFilter = useTableUsersStore((state) => state.globalFilter);
  const setGlobalFilter = useTableUsersStore((state) => state.setGlobalFilter);
  const rowSelection = useTableUsersStore((state) => state.selectedRowsState);
  const setRowSelection = useTableUsersStore(
    (state) => state.setSelectedRowsState
  );

  const table = useReactTable({
    data: usersOrdered,
    columns: getUsersColumns(roles),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    state: {
      globalFilter,
      rowSelection,
      pagination,
    },
    onRowSelectionChange: (updaterOrValue) => {
      setRowSelection(
        typeof updaterOrValue === "function"
          ? updaterOrValue(rowSelection)
          : updaterOrValue
      );
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
                className={`${row.getIsSelected() ? "bg-muted" : ""}`}
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
