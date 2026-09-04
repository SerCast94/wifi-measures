import { type ColumnDef } from "@tanstack/react-table";
import { LogInIcon, Trash2 } from "lucide-react";
import { Link } from "react-router";
import { Badge } from "@/core/atomic-components/badge";
import { Button } from "@/core/atomic-components/button";
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

interface GetAnalysesColumnsOptions {
  onDelete?: (id: number) => void;
}

export const getAnalysesColumns = ({
  onDelete,
}: GetAnalysesColumnsOptions = {}): ColumnDef<LinkLiveAnalysis>[] => [
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
    header: () => <div className="text-right">Acciones</div>,
    enableSorting: false,
    cell: ({ row }) => (
      <div className="text-right">
        <div className="flex justify-end gap-2">
          <Link to={`/analyses/${row.original.id}`}>
            <Button
              size="icon"
              title="Ir al análisis"
              className="bg-yellow-500 text-foreground hover:bg-yellow-500/90"
            >
              <LogInIcon className="w-4 h-4" />
            </Button>
          </Link>
          {onDelete && (
            <Button
              size="icon"
              variant="destructive"
              title="Eliminar análisis"
              onClick={(event) => {
                event.stopPropagation();
                onDelete(row.original.id);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    ),
    meta: { className: "w-24" },
  },
];