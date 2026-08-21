export interface AnalysisHostTypeDefinition {
  key: string;
  label: string;
  detailRequired: boolean;
}

export const ANALYSIS_HOST_TYPES: AnalysisHostTypeDefinition[] = [
  { key: "ap", label: "APs", detailRequired: true },
  { key: "bssid", label: "BSSIDs", detailRequired: true },
  { key: "ssid", label: "SSIDs", detailRequired: true },
  { key: "client", label: "Clientes", detailRequired: true },
  { key: "channel", label: "Canales", detailRequired: false },
  { key: "probingClient", label: "Probing clients", detailRequired: false },
  { key: "bluetoothDevice", label: "Bluetooth", detailRequired: false },
];

export const ANALYSIS_HOST_TYPE_KEYS = ANALYSIS_HOST_TYPES.map(
  (type) => type.key
);

export const getAnalysisHostTypeDefinition = (
  key: string
): AnalysisHostTypeDefinition =>
  ANALYSIS_HOST_TYPES.find((type) => type.key === key) ?? {
    key,
    label: key,
    detailRequired: true,
  };
