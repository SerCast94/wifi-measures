import { type ColumnDef, type Row } from "@tanstack/react-table";
import { ChevronDown, ChevronRight, Paperclip, RadioTowerIcon } from "lucide-react";
import { Link } from "react-router";

import { Button } from "@/core/atomic-components/button";
import type { Unit } from "@/features/netally/types/netally.types";

const formatDate = (date: string | null): string => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const firmwareSummary = (unit: Unit): string => {
  const versions = Object.values(unit.firmwareVersions ?? {});
  return unit.firmware ?? versions.join(", ") ?? "—";
};

export const getUnitsColumns = (): ColumnDef<Unit>[] => [
  {
    id: "expand",
    header: () => null,
    cell: ({ row }) => (
      <Button
        size="icon"
        variant="ghost"
        onClick={(e) => {
          e.stopPropagation();
          row.getToggleExpandedHandler()();
        }}
        title={row.getIsExpanded() ? "Ocultar archivos" : "Ver archivos subidos"}
      >
        {row.getIsExpanded() ? (
          <ChevronDown className="w-4 h-4" />
        ) : (
          <ChevronRight className="w-4 h-4" />
        )}
      </Button>
    ),
    meta: { className: "w-10" },
  },
  {
    accessorKey: "name",
    header: "NOMBRE",
    cell: ({ row }: { row: Row<Unit> }) => (
      <div className="min-w-[160px] my-2 font-medium">{row.original.name}</div>
    ),
  },
  {
    accessorKey: "unitType",
    header: "TIPO",
    cell: ({ row }: { row: Row<Unit> }) => (
      <div className="min-w-[110px]">{row.original.unitType}</div>
    ),
  },
  {
    accessorKey: "hardwareVersion",
    header: "MODELO",
    cell: ({ row }: { row: Row<Unit> }) => (
      <div className="min-w-[130px]">
        {row.original.hardwareVersion || row.original.model || "—"}
      </div>
    ),
  },
  {
    accessorKey: "mac",
    header: "MAC",
    cell: ({ row }: { row: Row<Unit> }) => (
      <div className="min-w-[120px]">{row.original.mac || "—"}</div>
    ),
  },
  {
    accessorKey: "serialNumber",
    header: "SERIAL",
    cell: ({ row }: { row: Row<Unit> }) => (
      <div className="min-w-[100px]">{row.original.serialNumber || "—"}</div>
    ),
  },
  {
    accessorKey: "ipWifiManagement",
    header: "IP WIFI",
    cell: ({ row }: { row: Row<Unit> }) => (
      <div className="min-w-[110px]">
        {row.original.ipWifiManagement || row.original.ipAddress || "—"}
      </div>
    ),
  },
  {
    accessorKey: "lastSeen",
    header: "ÚLTIMA CONEXIÓN",
    cell: ({ row }: { row: Row<Unit> }) => (
      <div className="min-w-[150px]">{formatDate(row.original.lastSeen)}</div>
    ),
  },
  {
    accessorKey: "firmwareVersions",
    header: "FIRMWARE",
    cell: ({ row }: { row: Row<Unit> }) => (
      <div className="min-w-[100px]">{firmwareSummary(row.original)}</div>
    ),
  },
  {
    accessorKey: "files.length",
    header: "ARCHIVOS",
    cell: ({ row }: { row: Row<Unit> }) => (
      <div className="flex items-center gap-1 min-w-[80px]">
        <Paperclip className="w-3.5 h-3.5" />
        {row.original.files.length}
      </div>
    ),
  },
  {
    id: "actions",
    header: "ACCIONES",
    cell: ({ row }: { row: Row<Unit> }) => (
      <Button
        variant="outline"
        size="sm"
        asChild
        className="min-w-[130px]"
        title="Ver medidas de esta unidad"
      >
        <Link to={`/measures?q=${encodeURIComponent(row.original.name)}`}>
          <RadioTowerIcon className="w-4 h-4" />
          Ver medidas
        </Link>
      </Button>
    ),
  },
];