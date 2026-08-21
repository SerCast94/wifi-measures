export interface SurveyMetricDefinition {
  key: string;
  label: string;
  unit: string;
  valueKey: string;
  hostType: string;
}

export const SURVEY_METRICS: SurveyMetricDefinition[] = [
  {
    key: "signal",
    label: "Señal",
    unit: "dBm",
    valueKey: "signal",
    hostType: "passive",
  },
  {
    key: "snr",
    label: "SNR",
    unit: "dB",
    valueKey: "snr",
    hostType: "passive",
  },
  {
    key: "bluetooth",
    label: "Bluetooth",
    unit: "dBm",
    valueKey: "signal",
    hostType: "bluetooth",
  },
  {
    key: "oneXone",
    label: "1×1",
    unit: "dBm",
    valueKey: "signal",
    hostType: "oneXone",
  },
  {
    key: "client",
    label: "Clientes",
    unit: "dBm",
    valueKey: "signal",
    hostType: "client",
  },
  {
    key: "probingClient",
    label: "Probing clients",
    unit: "dBm",
    valueKey: "signal",
    hostType: "probingClient",
  },
];

export const getSurveyMetricDefinition = (
  key: string
): SurveyMetricDefinition =>
  SURVEY_METRICS.find((metric) => metric.key === key) ?? {
    key,
    label: key,
    unit: "",
    valueKey: key,
    hostType: "passive",
  };
