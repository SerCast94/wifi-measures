import { useState } from "react";
import {
  ChevronDown,
  ChevronRight,
  RadioTowerIcon,
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
import type { LoraMeasure, LoraSample } from "../types/lora.types";
import {
  LORA_LEVEL_COLOR,
  LORA_LEVEL_LABEL,
  worseOf,
  levelOf,
  type LoraQualityLevel,
} from "../lib/lora-baremo";

const fmt = (value: number | null, digits = 1): string =>
  value === null || value === undefined ? "—" : Number(value).toFixed(digits);

const SAMPLE_HEADERS = [
  "Nº",
  "Hora",
  "RSSI (dBm)",
  "RSSIS (dBm)",
  "SNR (dB)",
  "Señal",
  "Calidad",
  "UL pkt.",
  "Confirm.",
  "Pérdida (%)",
  "Longitud",
  "Latitud",
  "Ubicación",
  "SF",
  "TX",
];

const sampleLevel = (sample: LoraSample): LoraQualityLevel =>
  levelOf({
    rssi:
      sample.rssi == null || Number.isNaN(Number(sample.rssi))
        ? null
        : Number(sample.rssi),
    snr:
      sample.snr == null || Number.isNaN(Number(sample.snr))
        ? null
        : Number(sample.snr),
    signal: sample.signal ?? null,
    sf: sample.sf ?? null,
    packetLossPct:
      sample.packetLossPct == null || Number.isNaN(Number(sample.packetLossPct))
        ? null
        : Number(sample.packetLossPct),
  });

const SampleTable = ({ samples }: { samples: LoraSample[] }) => (
  <div className="overflow-auto rounded-md border bg-muted/20">
    <Table>
      <TableHeader>
        <TableRow>
          {SAMPLE_HEADERS.map((header) => (
            <TableHead key={header} className="text-xs">
              {header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {samples.map((sample, index) => (
          <TableRow key={index}>
            <TableCell className="font-medium">{sample.txCnt ?? "—"}</TableCell>
            <TableCell>{sample.time ?? "—"}</TableCell>
            <TableCell>{fmt(sample.rssi)}</TableCell>
            <TableCell>{fmt(sample.rssis)}</TableCell>
            <TableCell>{fmt(sample.snr)}</TableCell>
            <TableCell>{sample.signal ?? "—"}</TableCell>
            <TableCell>
              <span
                className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold text-white ring-1 ring-inset ring-white/30"
                style={{ backgroundColor: LORA_LEVEL_COLOR[sampleLevel(sample)] }}
                title={LORA_LEVEL_LABEL[sampleLevel(sample)]}
              >
                <span className="h-1 w-1 rounded-full bg-white" />
                {LORA_LEVEL_LABEL[sampleLevel(sample)]}
              </span>
            </TableCell>
            <TableCell>{fmt(sample.uplinkPacket, 0)}</TableCell>
            <TableCell>{fmt(sample.confirmPacket, 0)}</TableCell>
            <TableCell>{fmt(sample.packetLossPct)}</TableCell>
            <TableCell>{fmt(sample.longitude, 6)}</TableCell>
            <TableCell>{fmt(sample.latitude, 6)}</TableCell>
            <TableCell>{sample.location ?? "—"}</TableCell>
            <TableCell>{sample.sf ?? "—"}</TableCell>
            <TableCell>{sample.txPower ?? "—"}</TableCell>
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
            title={row.getIsExpanded() ? "Ocultar muestras" : "Ver muestras"}
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
        accessorKey: "source",
        header: "Origen",
        cell: ({ row }) => row.original.source || "—",
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
        id: "calidad",
        header: "Calidad",
        cell: ({ row }) => {
          const measure = row.original;
          let level: LoraQualityLevel | null = null;
          for (const sample of measure.samples) {
            const sampleLevel = levelOf({
              rssi:
                sample.rssi == null || Number.isNaN(Number(sample.rssi))
                  ? null
                  : Number(sample.rssi),
              snr:
                sample.snr == null || Number.isNaN(Number(sample.snr))
                  ? null
                  : Number(sample.snr),
              signal: sample.signal ?? null,
              sf: sample.sf ?? null,
              packetLossPct:
                sample.packetLossPct == null ||
                Number.isNaN(Number(sample.packetLossPct))
                  ? null
                  : Number(sample.packetLossPct),
            });
            level = level === null ? sampleLevel : worseOf(level, sampleLevel);
          }
          if (!level) return "—";
          const color = LORA_LEVEL_COLOR[level];
          return (
            <span
              className="inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold text-white"
              style={{ backgroundColor: color }}
            >
              {LORA_LEVEL_LABEL[level]}
            </span>
          );
        },
      },
      {
        accessorKey: "txPower",
        header: "TX Power",
        cell: ({ row }) => row.original.txPower || "—",
      },
      {
        id: "samples-count",
        header: "Muestras",
        cell: ({ row }) => (
          <Badge variant="secondary">{row.original.samples.length}</Badge>
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
                  icon={RadioTowerIcon}
                  title="Todavía no hay medidas"
                  description="Carga un archivo CSV del escáner (1 fichero = 1 medida, cada fila es una muestra) para empezar."
                />
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row) => (
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
                      title="Eliminar medida"
                      disabled={deleting}
                      onClick={() => onDelete(row.original.id)}
                    >
                      <Trash2Icon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                ) : null}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {table.getRowModel().rows.map((row) =>
        row.getIsExpanded() ? (
          <div key={`${row.id}-expanded`}>
            <SampleTable samples={row.original.samples} />
          </div>
        ) : null
      )}
    </div>
  );
};