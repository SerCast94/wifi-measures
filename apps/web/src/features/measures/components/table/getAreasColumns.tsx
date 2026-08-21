import { format } from "date-fns";
import { es } from "date-fns/locale";
import { type ColumnDef, type Row } from "@tanstack/react-table";

import type { Area } from "../../types/areas.types";
import type { MeasureModel } from "../../models/measure.model";
import { GoToAreaBtn } from "../actions-buttons/GoToAreaBtn";

const NETALLY_COLORS: Record<string, string> = {
  red: "bg-red-500",
  yellow: "bg-yellow-400",
  green: "bg-green-500",
  black: "bg-gray-400",
};

const getLatestMeasure = (measures: MeasureModel[]): MeasureModel | undefined =>
  [...measures].sort(
    (a, b) => b.datetime.getTime() - a.datetime.getTime()
  )[0];

const statusBadge = (color: string) => (
  <div className="flex items-center gap-2">
    <span
      className={`inline-block w-3.5 h-3.5 rounded-full ${
        NETALLY_COLORS[color] ?? "bg-gray-300"
      }`}
    />
    <p className="text-sm capitalize">{color || "—"}</p>
  </div>
);

export const getAreasColumns = (): ColumnDef<Area>[] => {
  const columns = [
    {
      accessorKey: "name",
      header: "NOMBRE",
      cell: ({ row }: { row: Row<Area> }) => (
        <div className="w-[150px] my-2">{row.original.name}</div>
      ),
    },
    {
      id: "estado",
      header: "ESTADO",
      cell: ({ row }: { row: Row<Area> }) => (
        <div className="w-[100px]">
          {statusBadge(
            `${(
              (getLatestMeasure(row.original.measures)?.raw as
                | Record<string, unknown>
                | undefined)?.overallColor ?? ""
            )}`
          )}
        </div>
      ),
    },
    {
      id: "resultados",
      header: "Nº RESULTADOS",
      cell: ({ row }: { row: Row<Area> }) => (
        <div className="w-[75px]">{row.original.measures.length}</div>
      ),
    },
    {
      id: "ultimaFecha",
      header: "ÚLTIMA MEDICIÓN",
      cell: ({ row }: { row: Row<Area> }) => {
        const latest = getLatestMeasure(row.original.measures);
        return (
          <div className="w-[150px]">
            {latest
              ? format(latest.datetime, "dd/MM/yyyy HH:mm", { locale: es })
              : "—"}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: "ACCIONES",
      cell: ({ row }: { row: Row<Area> }) => (
        <div className="flex my-1 space-x-2">
          <GoToAreaBtn areaId={`${row.original.id}`} />
        </div>
      ),
    },
  ];

  return columns;
};