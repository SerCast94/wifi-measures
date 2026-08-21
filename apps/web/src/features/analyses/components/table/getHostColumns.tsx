import { type ColumnDef, type Row } from "@tanstack/react-table";
import { ChevronDown, ChevronRight, ChevronsUpDown } from "lucide-react";

import { cn } from "@/core/lib/utils";
import { Badge } from "@/core/atomic-components/badge";
import { Button } from "@/core/atomic-components/button";
import type { AnalysisHost } from "../../types/analysis.types";
import {
  formatDate,
  formatMac,
  formatSignal,
  formatSnr,
  getSortValue,
  renderCounts,
} from "./hosts-format";

interface HostColumn {
  key: string;
  label: string;
}

const COLUMNS: Record<string, HostColumn[]> = {
  ap: [
    { key: "name", label: "Nombre" },
    { key: "mac", label: "MAC" },
    { key: "channel", label: "Canal" },
    { key: "band", label: "Banda" },
    { key: "securityType", label: "Seguridad" },
    { key: "protocol", label: "Protocolo" },
    { key: "counts", label: "SSIDs/BSSIDs/Clientes" },
    { key: "inactive", label: "Estado" },
    { key: "lastSeen", label: "Última vez" },
  ],
  bssid: [
    { key: "name", label: "Nombre" },
    { key: "mac", label: "MAC" },
    { key: "channel", label: "Canal" },
    { key: "band", label: "Banda" },
    { key: "ssid", label: "SSID" },
    { key: "securityType", label: "Seguridad" },
    { key: "protocol", label: "Protocolo" },
    { key: "inactive", label: "Estado" },
    { key: "lastSeen", label: "Última vez" },
  ],
  ssid: [
    { key: "name", label: "SSID" },
    { key: "band", label: "Banda" },
    { key: "channel", label: "Canal" },
    { key: "securityType", label: "Seguridad" },
    { key: "protocol", label: "Protocolo" },
    { key: "counts", label: "APs/BSSIDs/Clientes" },
    { key: "inactive", label: "Estado" },
    { key: "lastSeen", label: "Última vez" },
  ],
  client: [
    { key: "name", label: "Nombre" },
    { key: "mac", label: "MAC" },
    { key: "ssid", label: "SSID" },
    { key: "channel", label: "Canal" },
    { key: "band", label: "Banda" },
    { key: "signal", label: "Señal" },
    { key: "snr", label: "SNR" },
    { key: "inactive", label: "Estado" },
    { key: "lastSeen", label: "Última vez" },
  ],
  probingClient: [
    { key: "name", label: "Nombre" },
    { key: "mac", label: "MAC" },
    { key: "ssid", label: "SSID" },
    { key: "channel", label: "Canal" },
    { key: "band", label: "Banda" },
    { key: "signal", label: "Señal" },
    { key: "snr", label: "SNR" },
    { key: "inactive", label: "Estado" },
    { key: "lastSeen", label: "Última vez" },
  ],
  channel: [
    { key: "channel", label: "Canal" },
    { key: "band", label: "Banda" },
    { key: "signal", label: "Señal AP" },
    { key: "snr", label: "SNR" },
    { key: "counts", label: "Utilización/Conteos" },
    { key: "inactive", label: "Estado" },
    { key: "lastSeen", label: "Última vez" },
  ],
  bluetoothDevice: [
    { key: "name", label: "Nombre" },
    { key: "mac", label: "MAC" },
    { key: "signal", label: "Señal" },
    { key: "protocol", label: "Beacon" },
    { key: "lastSeen", label: "Última vez" },
  ],
};

const nullSafeSortingFn = <T,>(
  rowA: Row<T>,
  rowB: Row<T>,
  columnId: string
): number => {
  const a = rowA.getValue(columnId) as unknown;
  const b = rowB.getValue(columnId) as unknown;
  const aEmpty = a === null || a === undefined || a === "";
  const bEmpty = b === null || b === undefined || b === "";
  if (aEmpty && bEmpty) return 0;
  if (aEmpty) return 1;
  if (bEmpty) return -1;
  if (typeof a === "number" && typeof b === "number") return a - b;
  return String(a).localeCompare(String(b), "es", {
    numeric: true,
    sensitivity: "base",
  });
};

const renderCell = (host: AnalysisHost, columnKey: string) => {
  switch (columnKey) {
    case "name":
      return (
        <div
          className="w-full truncate font-medium"
          title={host.name && host.name !== "--" ? host.name : undefined}
        >
          {host.name && host.name !== "--" ? host.name : "—"}
        </div>
      );
    case "mac":
      return (
        <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground whitespace-nowrap">
          {formatMac(host.mac)}
        </span>
      );
    case "channel":
      return <span className="whitespace-nowrap">{host.channel ?? "—"}</span>;
    case "band":
      return <span className="whitespace-nowrap">{host.band ?? "—"}</span>;
    case "ssid":
      return (
        <div className="w-full truncate" title={host.ssid ?? undefined}>
          {host.ssid ?? "—"}
        </div>
      );
    case "securityType":
      return <span className="whitespace-nowrap">{host.securityType ?? "—"}</span>;
    case "protocol":
      return <span className="whitespace-nowrap">{host.protocol ?? "—"}</span>;
    case "signal":
      return <span className="whitespace-nowrap">{formatSignal(host.signal)}</span>;
    case "snr":
      return <span className="whitespace-nowrap">{formatSnr(host.snr)}</span>;
    case "counts":
      return (
        <div className="w-full truncate text-xs" title={renderCounts(host.counts)}>
          {renderCounts(host.counts)}
        </div>
      );
    case "inactive":
      return (
        <Badge variant={host.inactive ? "secondary" : "default"}>
          {host.inactive ? "Inactivo" : "Activo"}
        </Badge>
      );
    case "lastSeen":
      return (
        <span className="text-muted-foreground whitespace-nowrap">
          {formatDate(host.lastSeen)}
        </span>
      );
    default:
      return "—";
  }
};

const RESPONSIVE_HIDE: Record<string, string> = {
  protocol: "hidden lg:table-cell",
  securityType: "hidden xl:table-cell",
  counts: "hidden md:table-cell",
  snr: "hidden md:table-cell",
};

const COLUMN_WIDTHS: Record<string, string> = {
  expand: "w-10",
  mac: "w-36",
  channel: "w-14",
  band: "w-20",
  securityType: "w-24",
  protocol: "w-28",
  signal: "w-20",
  snr: "w-16",
  inactive: "w-24",
  lastSeen: "w-36",
};

export const getHostColumns = (
  hostType: string
): ColumnDef<AnalysisHost>[] => {
  const columns = COLUMNS[hostType] ?? COLUMNS.ap;

  const dataColumns: ColumnDef<AnalysisHost>[] = columns.map(
    ({ key, label }) => ({
      id: key,
      accessorFn: (host) => getSortValue(host, key),
      header: label,
      sortingFn: nullSafeSortingFn,
      filterFn:
        key === "band" || key === "inactive" ? "equals" : "auto",
      cell: ({ row }) => renderCell(row.original, key),
      meta: {
        className: cn(
          RESPONSIVE_HIDE[key] ?? "",
          COLUMN_WIDTHS[key] ?? ""
        ),
      },
    })
  );

  return [
    {
      id: "expand",
      header: ({ table }) => (
        <Button
          type="button"
          variant="ghost"
          size="iconMap"
          onClick={table.getToggleAllRowsExpandedHandler()}
          aria-label={table.getIsAllRowsExpanded() ? "Contraer todo" : "Expandir todo"}
        >
          <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />
        </Button>
      ),
      cell: ({ row }) => (
        <Button
          type="button"
          variant="ghost"
          size="iconMap"
          onClick={() => row.toggleExpanded()}
          aria-label={row.getIsExpanded() ? "Contraer detalles" : "Ver detalles"}
        >
          {row.getIsExpanded() ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
        </Button>
      ),
      enableSorting: false,
      meta: { className: "w-10" },
    },
    ...dataColumns,
  ];
};