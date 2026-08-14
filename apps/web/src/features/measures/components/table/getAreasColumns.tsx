import { type ColumnDef, type Row } from "@tanstack/react-table";

import type { Area } from "../../types/areas.types";
import { GoToAreaBtn } from "../actions-buttons/GoToAreaBtn";
import { DownloadAreaReportBtn } from "../actions-buttons/DownloadAreaReportBtn";
import { DownloadAreaImagesBtn } from "../actions-buttons/DownloadAreaImagesBtn";

export const getAreasColumns = (): ColumnDef<Area>[] => {
  const columns = [
    {
      accessorKey: "id",
      header: "ID AREA",
      cell: ({ row }: { row: Row<Area> }) => (
        <div className="w-[75px] my-2">{row.original.id}</div>
      ),
    },
    {
      accessorKey: "name",
      header: "NOMBRE",
      cell: ({ row }: { row: Row<Area> }) => (
        <div className="w-[150px] my-2">{row.original.name}</div>
      ),
    },
    {
      accessorKey: "provincia",
      header: "PROVINCIA",
      cell: ({ row }: { row: Row<Area> }) => (
        <div className="w-[75px]">{row.original.provincia}</div>
      ),
    },
    {
      accessorKey: "measures.length",
      header: "Nº MEDIDAS",
      cell: ({ row }: { row: Row<Area> }) => (
        <div className="w-[75px]">{row.original.measures.length}</div>
      ),
    },
    {
      accessorKey: "measures",
      header: "MEDIDAS",
      cell: ({ row }: { row: Row<Area> }) => (
        <div className="w-[150px]">
          {row.original.measures
            .map(
              (measure) =>
                `P${measure.metadata["PTO_MEDIDA"]}M${measure.metadata["N_MEDIDA"]}`
            )
            .join(", ")}
        </div>
      ),
    },
    {
      id: "actions",
      header: "ACCIONES",
      cell: ({ row }: { row: Row<Area> }) => (
        <div className="flex my-1 space-x-2">
          <DownloadAreaReportBtn
            className="hidden sm:flex"
            area={row.original}
          />
          <DownloadAreaImagesBtn
            className="hidden text-white bg-green-800 sm:flex hover:bg-green-900"
            area={row.original}
          />
          <GoToAreaBtn areaId={`${row.original.id}`} />
        </div>
      ),
    },
  ];

  return columns;
};
