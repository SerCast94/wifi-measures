import { useState } from "react";
import {
  AudioWaveformIcon,
  ChevronDown,
  ChevronRight,
  Trash2Icon,
} from "lucide-react";
import {
  flexRender,
  type ExpandedState,
  getCoreRowModel,
  getExpandedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import { Badge } from "@/core/atomic-components/badge";
import { Button } from "@/core/atomic-components/button";
import { EmptyState } from "@/core/atomic-components/empty-state";
import { cn } from "@/core/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/atomic-components/table";
import type { LoraNoise, LoraNoiseEntry } from "../types/lora.types";

const fmt = (value: number | null, digits = 1): string =>
  value === null || value === undefined ? "—" : Number(value).toFixed(digits);

const ENTRIES_HEADERS = ["Frecuencia", "Scan actual (dBm)", "Media ponderada (dBm)"];

const EntriesTable = ({ entries }: { entries: LoraNoiseEntry[] }) => (
  <div className="overflow-auto rounded-md border bg-muted/20">
    <Table>
      <TableHeader>
        <TableRow>
          {ENTRIES_HEADERS.map((header) => (
            <TableHead key={header} className="text-xs">
              {header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {entries.map((entry, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium">{fmt(entry.frequency)}</TableCell>
            <TableCell>{fmt(entry.currentScan)}</TableCell>
            <TableCell>{fmt(entry.weightedAverageScan)}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

interface LoraNoiseTableProps {
  noise?: LoraNoise[];
  onDelete?: (id: number) => void;
  deleting?: boolean;
}

export const LoraNoiseTable = ({
  noise,
  onDelete,
  deleting,
}: LoraNoiseTableProps) => {
  const rows = noise ?? [];
  const [expanded, setExpanded] = useState<ExpandedState>({});

  const table = useReactTable({
    data: rows,
    columns: [
      {
        id: "expand",
        header: () => null,
        cell: ({ row }) => (
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            onClick={(e) => {
              e.stopPropagation();
              row.getToggleExpandedHandler()();
            }}
            title={row.getIsExpanded() ? "Ocultar frecuencias" : "Ver frecuencias"}
          >
            {row.getIsExpanded() ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        ),
        meta: { className: "w-10" },
      },
      {
        accessorKey: "id",
        header: "ID",
        cell: ({ row }) => <span className="font-medium">#{row.original.id}</span>,
      },
      {
        accessorKey: "location",
        header: "Ubicación",
        cell: ({ row }) => row.original.location || "—",
      },
      {
        accessorKey: "longitude",
        header: "Longitud",
        cell: ({ row }) => fmt(row.original.longitude, 6),
      },
      {
        accessorKey: "latitude",
        header: "Latitud",
        cell: ({ row }) => fmt(row.original.latitude, 6),
      },
      {
        id: "entries-count",
        header: "Frecuencias",
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.entries.length}</Badge>
        ),
      },
    ],
    getRowCanExpand: () => true,
    getCoreRowModel: getCoreRowModel(),
    getExpandedRowModel: getExpandedRowModel(),
    state: { expanded },
    onExpandedChange: setExpanded,
  });

  return (
    <div className="overflow-auto rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead
                  key={header.id}
                  className={cn(
                    "text-foreground",
                    header.column.columnDef.meta?.className
                  )}
                >
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
              {onDelete ? (
                <TableHead className="text-foreground" />
              ) : null}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={table.getHeaderGroups()[0].headers.length + (onDelete ? 1 : 0)}
                className="p-0"
              >
                <EmptyState
                  icon={AudioWaveformIcon}
                  title="Todavía no hay datos de ruido"
                  description="Carga un archivo CSV (1 archivo = 1 registro) para empezar."
                />
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
              <>
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell
                      key={cell.id}
                      className={cn(cell.column.columnDef.meta?.className)}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                  {onDelete ? (
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="destructive"
                        title="Eliminar ruido"
                        disabled={deleting}
                        onClick={() => onDelete(row.original.id)}
                      >
                        <Trash2Icon className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  ) : null}
                </TableRow>
                {row.getIsExpanded() && (
                  <TableRow key={`${row.id}-expanded`}>
                    <TableCell colSpan={row.getVisibleCells().length + (onDelete ? 1 : 0)}>
                      <EntriesTable entries={row.original.entries} />
                    </TableCell>
                  </TableRow>
                )}
              </>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
};
