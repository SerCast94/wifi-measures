export interface AnalysisHostCounts {
  ap: number;
  bssid: number;
  ssid: number;
  client: number;
  channel: number;
  probingClient: number;
  bluetoothDevice: number;
}

export interface LinkLiveAnalysis {
  id: number;
  idLinkLive: string;
  guid: string | null;
  analysisGuid: string | null;
  analysisType: string | null;
  name: string | null;
  status: string | null;
  startTime: string | null;
  endTime: string | null;
  fileName: string | null;
  unitName: string | null;
  unitType: string | null;
  unitHardware: string | null;
  apsCount: number;
  bssidsCount: number;
  ssidsCount: number;
  clientsCount: number;
  channelsCount: number;
  probingClientsCount: number;
  bluetoothCount: number;
  hostCount?: number;
  href: string | null;
  hostCounts?: AnalysisHostCounts;
  createdAt: string;
  updatedAt: string;
}

export interface AnalysisHost {
  id: number;
  hostType: string;
  name: string | null;
  mac: string | null;
  channel: string | null;
  band: string | null;
  signal: number | null;
  snr: number | null;
  ssid: string | null;
  securityType: string | null;
  protocol: string | null;
  inactive: boolean;
  lastSeen: string | null;
  counts: Record<string, number> | null;
}

export const ANALYSIS_HOST_TYPES: Array<{ key: string; label: string }> = [
  { key: "ap", label: "APs" },
  { key: "bssid", label: "BSSIDs" },
  { key: "ssid", label: "SSIDs" },
  { key: "client", label: "Clientes" },
  { key: "channel", label: "Canales" },
  { key: "probingClient", label: "Probing clients" },
  { key: "bluetoothDevice", label: "Bluetooth" },
];

export const getAnalysisHostTypeLabel = (key: string): string =>
  ANALYSIS_HOST_TYPES.find((type) => type.key === key)?.label ?? key;