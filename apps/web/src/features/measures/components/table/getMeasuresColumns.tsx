import { type ColumnDef, type Row } from "@tanstack/react-table";

import { ChannelsPopover } from "../ChannelsPopover";
import type { MeasureModel } from "../../models/measure.model";
import { DownloadMeasureImagesBtn } from "../actions-buttons/DownloadMeasureImagesBtn";
import { GoToMeasureBtn } from "../actions-buttons/GoToMeasureBtn";

export const getMeasuresColumns = (): ColumnDef<MeasureModel>[] => {
  const columns = [
    {
      accessorKey: "metadata.ID_AREA",
      header: "ID AREA",
      cell: ({ row }: { row: Row<MeasureModel> }) => (
        <div className="w-[75px]">{row.original.metadata["ID_AREA"]}</div>
      ),
    },
    {
      accessorKey: "metadata.AREA_GEOGR",
      header: "AREA GEOGR",
      cell: ({ row }: { row: Row<MeasureModel> }) => (
        <div className="w-[150px]">{row.original.metadata["AREA_GEOGR"]}</div>
      ),
    },
    {
      accessorKey: "metadata.PROVINCIA",
      header: "PROVINCIA",
      cell: ({ row }: { row: Row<MeasureModel> }) => (
        <div className="w-[100px]">{row.original.metadata["PROVINCIA"]}</div>
      ),
    },
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
      accessorKey: "metadata.EMISIONES",
      header: "EMISIONES",
      cell: ({ row }: { row: Row<MeasureModel> }) => (
        <div className="w-[100px]">
          <center>{row.original.metadata["EMISIONES"]}</center>
        </div>
      ),
    },
    {
      accessorKey: "metadata.PTO_MEDIDA",
      header: "PTO MEDIDA",
      cell: ({ row }: { row: Row<MeasureModel> }) => (
        <div className="w-[100px]">
          <center>{row.original.metadata["PTO_MEDIDA"]}</center>
        </div>
      ),
    },
    {
      accessorKey: "metadata.N_MEDIDA",
      header: "N MEDIDA",
      cell: ({ row }: { row: Row<MeasureModel> }) => (
        <div className="w-[75px]">
          <center>{row.original.metadata["N_MEDIDA"]}</center>
        </div>
      ),
    },
    {
      accessorKey: "metadata.AZIMUT",
      header: "AZIMUT",
      cell: ({ row }: { row: Row<MeasureModel> }) => (
        <div className="w-[75px]">
          <center>{row.original.metadata["AZIMUT"]}</center>
        </div>
      ),
    },
    {
      accessorKey: "Channels",
      header: "CANALES",
      cell: ({ row }: { row: Row<MeasureModel> }) => (
        <pre className="w-[100px]">
          {
            row.original.channels && (
              <ChannelsPopover channels={row.original.channels} />
            ) /* Si no hay canales, no renderiza nada */
          }
        </pre>
      ),
    },
    {
      id: "actions",
      header: "ACCIONES",
      cell: ({ row }: { row: Row<MeasureModel> }) => (
        <div className="flex my-1 space-x-2">
          <DownloadMeasureImagesBtn
            className="hidden text-white bg-green-800 sm:flex"
            measure={row.original}
          />
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
