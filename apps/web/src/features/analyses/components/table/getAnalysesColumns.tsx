import { type ColumnDef } from "@tanstack/react-table";
import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router";

import { Badge } from "@/core/atomic-components/badge";
import type { LinkLiveAnalysis } from "../../types/analysis.types";

const formatDate = (value: string | null): string => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const getAnalysesColumns = (): ColumnDef<LinkLiveAnalysis>[] => [
  {
    accessorFn: (analysis) =>
      analysis.name ?? analysis.fileName ?? analysis.idLinkLive,
    id: "name",
    header: "Análisis",
    cell: ({ row }) => (
      <div className="w-full truncate font-medium whitespace-nowrap" title={row.getValue<string>("name")}>
        {row.getValue<string>("name")}
      </div>
    ),
  },
  {
    accessorKey: "startTime",
    header: "Inicio",
    sortingFn: "datetime",
    cell: ({ row }) => (
      <div className="whitespace-nowrap">
        {formatDate(row.getValue<string | null>("startTime"))}
      </div>
    ),
    meta: { className: "w-32" },
  },
  {
    accessorKey: "endTime",
    header: "Fin",
    sortingFn: "datetime",
    cell: ({ row }) => (
      <div className="text-muted-foreground whitespace-nowrap">
        {formatDate(row.getValue<string | null>("endTime"))}
      </div>
    ),
    meta: { className: "w-32" },
  },
  {
    accessorKey: "apsCount",
    header: () => <div className="text-center">APs</div>,
    cell: ({ row }) => (
      <div className="text-center whitespace-nowrap">
        {row.getValue<number>("apsCount")}
      </div>
    ),
    meta: { className: "text-center w-14" },
  },
  {
    accessorKey: "bssidsCount",
    header: () => <div className="text-center">BSSIDs</div>,
    cell: ({ row }) => (
      <div className="text-center whitespace-nowrap">
        {row.getValue<number>("bssidsCount")}
      </div>
    ),
    meta: { className: "text-center w-20" },
  },
  {
    accessorKey: "ssidsCount",
    header: () => <div className="text-center">SSIDs</div>,
    cell: ({ row }) => (
      <div className="text-center whitespace-nowrap">
        {row.getValue<number>("ssidsCount")}
      </div>
    ),
    meta: { className: "text-center w-14" },
  },
  {
    accessorKey: "clientsCount",
    header: () => <div className="text-center">Clientes</div>,
    cell: ({ row }) => (
      <div className="text-center whitespace-nowrap">
        {row.getValue<number>("clientsCount")}
      </div>
    ),
    meta: { className: "text-center w-20" },
  },
  {
    accessorKey: "unitName",
    header: "Unidad",
    cell: ({ row }) => (
      <div
        className="w-full truncate text-muted-foreground whitespace-nowrap"
        title={row.getValue<string | null>("unitName") ?? undefined}
      >
        {row.getValue<string | null>("unitName") ?? "—"}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Estado",
    cell: ({ row }) => {
      const status = row.getValue<string | null>("status");
      return (
        <Badge variant={status === "ready" ? "default" : "secondary"}>
          {status ?? "—"}
        </Badge>
      );
    },
    meta: { className: "w-24" },
  },
  {
    id: "actions",
    header: () => <div className="text-right">Ver</div>,
    enableSorting: false,
    cell: ({ row }) => (
      <div className="text-right">
        <Link
          to={`/analyses/${row.original.id}`}
          className="inline-flex items-center gap-1 text-sm text-primary hover:underline whitespace-nowrap"
        >
          Ver <ArrowUpRight className="w-3.5 h-3.5" />
        </Link>
      </div>
    ),
    meta: { className: "w-16" },
  },
];