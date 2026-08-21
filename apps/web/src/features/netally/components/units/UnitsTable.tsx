import { useEffect, useState } from "react";

import { parseAsString, useQueryState } from "nuqs";
import {
  flexRender,
  type ExpandedState,
  getCoreRowModel,
  getExpandedRowModel,
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
import { sizeOptions } from "@/features/measures/constants/table";
import { useUnits } from "@/features/netally/hooks/use-units";
import { getUnitsColumns } from "./getUnitsColumns";
import { UnitFiles } from "./UnitFiles";
import CustomLoading from "@/core/components/CustomLoading";
import Paginator from "@/core/components/Pagination/Paginator";
import { PaginationStats } from "@/core/components/Pagination/PaginationStats";
import { PageSizeSelector } from "@/core/components/Pagination/PageSizeSelector";

export const UnitsTable = () => {
  const { data: units, isLoading, isError } = useUnits();

  const [queryFilter, setQueryFilter] = useQueryState(
    "q",
    parseAsString.withDefault("")
  );
  const [globalFilter, setGlobalFilter] = useState(queryFilter);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: sizeOptions[0],
  });
  const [expanded, setExpanded] = useState<ExpandedState>({});

  useEffect(() => {
    setQueryFilter(globalFilter);
  }, [globalFilter, setQueryFilter]);

  const table = useReactTable({
    data: units ?? [],
    columns: getUnitsColumns(),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    getRowCanExpand: () => true,
    state: {
      globalFilter,
      pagination,
      expanded,
    },
    onGlobalFilterChange: setGlobalFilter,
    onExpandedChange: setExpanded,
    onPaginationChange: (updaterOrValue) => {
      setPagination(
        typeof updaterOrValue === "function"
          ? updaterOrValue(pagination)
          : updaterOrValue
      );
    },
    autoResetPageIndex: false,
  });

  if (isLoading) {
    return <CustomLoading />;
  }

  if (isError) {
    return (
      <div className="p-4 text-sm text-red-600">
        No se pudieron cargar las unidades desde Link-Live.
      </div>
    );
  }

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
              <>
                <TableRow key={row.id} data-state={row.getIsSelected() ? "selected" : undefined}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(cell.column.columnDef.meta?.className)}
                    >
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
                {row.getIsExpanded() && (
                  <TableRow key={`${row.id}-expanded`}>
                    <TableCell colSpan={row.getVisibleCells().length}>
                      <UnitFiles files={row.original.files} />
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))}
            {table.getRowCount() === 0 && (
              <TableRow>
                <TableCell colSpan={table.getAllColumns().length}>
                  <div className="flex items-center justify-center py-4 text-muted-foreground">
                    No se encontraron unidades
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
            selectedRowsCount={0}
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