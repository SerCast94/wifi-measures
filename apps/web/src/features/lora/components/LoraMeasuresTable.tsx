import { useState } from "react";
import {
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

import { Button } from "@/core/atomic-components/button";
import { cn } from "@/core/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/core/atomic-components/table";
import type { LoraMeasure, LoraMeasureBlock } from "../types/lora.types";

const fmt = (value: number | null, digits = 1): string =>
  value === null || value === undefined ? "—" : Number(value).toFixed(digits);

const BLOCK_HEADERS = [
  "Rol",
  "Total paq.",
  "Paq. correctos",
  "RSSI (dBm)",
  "SNR (dB)",
  "Pérdida (%)",
  "Longitud",
  "Latitud",
  "Ubicación",
];

const BlockTable = ({ blocks }: { blocks: LoraMeasureBlock[] }) => (
  <div className="overflow-auto rounded-md border bg-muted/20">
    <Table>
      <TableHeader>
        <TableRow>
          {BLOCK_HEADERS.map((header) => (
            <TableHead key={header} className="text-xs">
              {header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {blocks.map((block, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium">{block.role ?? "—"}</TableCell>
            <TableCell>{fmt(block.totalPackets, 0)}</TableCell>
            <TableCell>{fmt(block.successfulPackets, 0)}</TableCell>
            <TableCell>{fmt(block.rssi)}</TableCell>
            <TableCell>{fmt(block.snr)}</TableCell>
            <TableCell>{fmt(block.packetLossPct)}</TableCell>
            <TableCell>{fmt(block.longitude, 6)}</TableCell>
            <TableCell>{fmt(block.latitude, 6)}</TableCell>
            <TableCell>{block.location ?? "—"}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
);

interface LoraMeasuresTableProps {
  measures?: LoraMeasure[];
  onDelete?: (id: number) => void;
  deleting?: boolean;
}

export const LoraMeasuresTable = ({
  measures,
  onDelete,
  deleting,
}: LoraMeasuresTableProps) => {
  const rows = measures ?? [];
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
            title={row.getIsExpanded() ? "Ocultar bloques" : "Ver bloques"}
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
        cell: ({ row }) => (
          <span className="font-medium">#{row.original.id}</span>
        ),
      },
      {
        accessorKey: "location",
        header: "Ubicación",
        cell: ({ row }) => row.original.location || "—",
      },
      {
        accessorKey: "time",
        header: "Fecha / hora",
        cell: ({ row }) => row.original.time || "—",
      },
      {
        accessorKey: "spreadingFactor",
        header: "SF",
        cell: ({ row }) => row.original.spreadingFactor || "—",
      },
      {
        accessorKey: "txPower",
        header: "TX Power",
        cell: ({ row }) => row.original.txPower || "—",
      },
      {
        id: "blocks-count",
        header: "Bloques",
        cell: ({ row }) => (
          <span className="inline-flex rounded-full bg-muted px-2 py-0.5 text-xs">
            {row.original.blocks.length}
          </span>
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
                colSpan={8}
                className="py-8 text-center text-muted-foreground"
              >
                Todavía no hay medidas. Carga un archivo CSV para empezar.
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
                        variant="ghost"
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
                      <BlockTable blocks={row.original.blocks} />
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
