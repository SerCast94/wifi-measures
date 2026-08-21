import type { AnalysisHost } from "../../types/analysis.types";

export const formatDate = (value: string | null): string => {
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

export const formatSignal = (value: number | null): string =>
  value === null ? "—" : `${value.toFixed(0)} dBm`;

export const formatSnr = (value: number | null): string =>
  value === null ? "—" : `${value.toFixed(0)} dB`;

export const formatMac = (value: string | null): string => {
  if (!value) return "—";
  const clean = value.replace(/[^0-9a-fA-F]/g, "");
  if (clean.length !== 12) return value;
  return clean.toLowerCase().match(/.{1,2}/g)?.join(":") ?? value;
};

export const countLabels: Record<string, string> = {
  apCount: "APs",
  ssidCount: "SSIDs",
  bssidCount: "BSSIDs",
  clientCount: "Clientes",
  channelCount: "Canales",
  probingClientCount: "Probing",
};

export const renderCounts = (
  counts: Record<string, number> | null
): string => {
  if (!counts) return "—";
  return Object.entries(counts)
    .filter(([, value]) => value !== null)
    .map(([key, value]) => `${countLabels[key] ?? key}: ${value}`)
    .join(" · ");
};

export const countTotal = (
  counts: Record<string, number> | null
): number | null => {
  if (!counts) return null;
  const total = Object.values(counts).reduce(
    (acc, value) => acc + (Number.isFinite(value) ? value : 0),
    0
  );
  return total;
};

export const getSortValue = (
  host: AnalysisHost,
  key: string
): unknown => {
  switch (key) {
    case "name":
      return host.name && host.name !== "--" ? host.name : "";
    case "mac":
      return host.mac ?? "";
    case "channel":
      return host.channel ?? "";
    case "band":
      return host.band ?? "";
    case "ssid":
      return host.ssid ?? "";
    case "securityType":
      return host.securityType ?? "";
    case "protocol":
      return host.protocol ?? "";
    case "signal":
      return host.signal;
    case "snr":
      return host.snr;
    case "counts":
      return countTotal(host.counts);
    case "inactive":
      return host.inactive;
    case "lastSeen":
      return host.lastSeen ? new Date(host.lastSeen).getTime() : null;
    default:
      return "";
  }
};