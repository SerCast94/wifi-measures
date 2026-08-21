import { type ColumnDef, type Row } from "@tanstack/react-table";
import { Link } from "react-router";

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
        <div className="w-[120px]">
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
      header: "ÁREA",
      cell: ({ row }: { row: Row<MeasureModel> }) => {
        const areaId = row.original.metadata["ID_AREA"];
        return (
          <div className="w-[200px]">
            {areaId ? (
              <Link
                to={`/areas/${areaId}`}
                className="text-primary hover:underline"
              >
                {row.original.metadata["AREA_GEOGR"]}
              </Link>
            ) : (
              row.original.metadata["AREA_GEOGR"]
            )}
          </div>
        );
      },
    },
    {
      accessorKey: "name",
      header: "PERFIL",
      cell: ({ row }: { row: Row<MeasureModel> }) => (
        <div className="w-[100px]">{row.original.name}</div>
      ),
    },
    {
      id: "unidad",
      accessorFn: (row: MeasureModel) =>
        `${(row.raw as Record<string, unknown>)?.unit_name ?? ""}`,
      header: "UNIDAD",
      cell: ({ row }: { row: Row<MeasureModel> }) => {
        const raw = getRaw(row.original);
        const unitName = `${raw?.unit_name ?? ""}`;
        return (
          <div className="w-[180px] text-muted-foreground">
            {unitName || "—"}
          </div>
        );
      },
    },
    {
      accessorKey: "metadata.EMISIONES",
      header: "TIPO",
      cell: ({ row }: { row: Row<MeasureModel> }) => (
        <div className="w-[90px]">
          <center>{row.original.metadata["EMISIONES"]}</center>
        </div>
      ),
    },
    {
      accessorKey: "raw.linkSignalLevelMean",
      header: "SEÑAL (dBm)",
      cell: ({ row }: { row: Row<MeasureModel> }) => (
        <div className="w-[90px]">
          <center>{formatNumber(getRaw(row.original)?.linkSignalLevelMean)}</center>
        </div>
      ),
    },
    {
      accessorKey: "raw.linkSNRMean",
      header: "SNR (dB)",
      cell: ({ row }: { row: Row<MeasureModel> }) => (
        <div className="w-[80px]">
          <center>{formatNumber(getRaw(row.original)?.linkSNRMean)}</center>
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
          <div className="w-[100px]">
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
          <div className="w-[200px] text-xs text-red-600">
            {failures.length > 0 ? failures.join(" · ") : "—"}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "ACCIONES",
      cell: ({ row }: { row: Row<MeasureModel> }) => (
        <div className="flex my-1 space-x-2">
          <GoToMeasureBtn
            className="hidden sm:flex"
            measureId={`${row.original.id}`}
          />
        </div>
      ),
    },
  ];

  return columns;
};