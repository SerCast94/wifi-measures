import { type ColumnDef, type Row } from "@tanstack/react-table";

import type { MeasureModel } from "../../models/measure.model";
import { GoToMeasureBtn } from "../actions-buttons/GoToMeasureBtn";

const NETALLY_COLORS: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-yellow-400",
  green: "bg-green-500",
};

const getRaw = (measure: MeasureModel): Record<string, unknown> | null =>
  measure.raw ? (measure.raw as Record<string, unknown>) : null;

const formatNumber = (value: unknown): string => {
  if (typeof value === "number") return value.toFixed(1);
  if (value === null || value === undefined || value === "--" || value === "")
    return "—";
  return `${value}`;
};

export const getMeasuresColumns = (): ColumnDef<MeasureModel>[] => {
  const columns = [
    {
      accessorKey: "datetime",
      header: "FECHA Y HORA",
      cell: ({ row }: { row: Row<MeasureModel> }) => (
        <div className="w-[150px] whitespace-nowrap">
          {new Date(row.original.datetime).toLocaleString("es-ES", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      ),
    },
    {
      accessorKey: "metadata.AREA_GEOGR",
      header: "DISPOSITIVO",
      cell: ({ row }: { row: Row<MeasureModel> }) => {
        const label = `${row.original.metadata["AREA_GEOGR"] ?? ""}`;
        return (
          <div className="w-[220px]">
            <span className="block truncate" title={label}>
              {label || "—"}
            </span>
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "PERFIL",
      cell: ({ row }: { row: Row<MeasureModel> }) => (
        <div
          className="w-[110px] truncate"
          title={`${row.original.name ?? ""}`}
        >
          {row.original.name || "—"}
        </div>
      ),
    },
    {
      accessorKey: "metadata.EMISIONES",
      header: "TIPO",
      cell: ({ row }: { row: Row<MeasureModel> }) => (
        <div className="w-[80px] whitespace-nowrap text-center">
          {row.original.metadata["EMISIONES"] || "—"}
        </div>
      ),
    },
    {
      accessorKey: "raw.linkSignalLevelMean",
      header: "SEÑAL (dBm)",
      cell: ({ row }: { row: Row<MeasureModel> }) => (
        <div className="w-[90px] whitespace-nowrap text-center">
          {formatNumber(getRaw(row.original)?.linkSignalLevelMean)}
        </div>
      ),
    },
    {
      accessorKey: "raw.linkSNRMean",
      header: "SNR (dB)",
      cell: ({ row }: { row: Row<MeasureModel> }) => (
        <div className="w-[80px] whitespace-nowrap text-center">
          {formatNumber(getRaw(row.original)?.linkSNRMean)}
        </div>
      ),
    },
    {
      accessorKey: "raw.overallColor",
      header: "ESTADO",
      cell: ({ row }: { row: Row<MeasureModel> }) => {
        const raw = getRaw(row.original);
        if (!raw) return null;
        const color = `${raw.overallColor ?? ""}`;
        return (
          <div className="w-[90px] whitespace-nowrap">
            <div className="flex items-center justify-center gap-1">
              <span
                className={`inline-block w-2.5 h-2.5 rounded-full ${
                  NETALLY_COLORS[color] ?? "bg-gray-300"
                }`}
              />
              <span className="capitalize">{color || "—"}</span>
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "raw.linkFailureReasons",
      header: "MOTIVO",
      cell: ({ row }: { row: Row<MeasureModel> }) => {
        const raw = getRaw(row.original);
        const failures = [
          ...((raw?.linkFailureReasons ?? []) as unknown[]),
          ...((raw?.failureReasons ?? []) as unknown[]),
        ];
        return (
          <div className="min-w-[160px] max-w-[260px] break-words text-xs text-red-600">
            {failures.length > 0 ? failures.join(" · ") : "—"}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "ACCIONES",
      cell: ({ row }: { row: Row<MeasureModel> }) => (
        <div className="w-[70px]">
          <div className="flex my-1 space-x-2">
            <GoToMeasureBtn
              className="hidden sm:flex"
              measureId={`${row.original.id}`}
            />
          </div>
        </div>
      ),
    },
  ];

  return columns;
};
