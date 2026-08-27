export const AUDIT_STATUSES = [
  "BORRADOR",
  "PLANIFICADA",
  "EN_CURSO",
  "PENDIENTE_DE_REVISION",
  "COMPLETADA",
  "INFORME_GENERADO",
  "CERRADA",
] as const;

export type AuditStatus = (typeof AUDIT_STATUSES)[number];

export const AUDIT_TEST_SECTIONS = [
  "PRE_AUDITORIA",
  "RECONOCIMIENTO_RF",
  "COBERTURA",
  "CONECTIVIDAD",
  "RENDIMIENTO",
  "MOVILIDAD",
  "CIERRE",
] as const;

export type AuditTestSection = (typeof AUDIT_TEST_SECTIONS)[number];

export const SECTION_LABELS: Record<AuditTestSection, string> = {
  PRE_AUDITORIA: "Pre-auditoría",
  RECONOCIMIENTO_RF: "Reconocimiento RF",
  COBERTURA: "Cobertura",
  CONECTIVIDAD: "Conectividad",
  RENDIMIENTO: "Rendimiento",
  MOVILIDAD: "Movilidad",
  CIERRE: "Cierre",
};

export const AUDIT_CATEGORIES = [
  "RADIO",
  "COBERTURA",
  "CONECTIVIDAD",
  "RENDIMIENTO",
  "MOVILIDAD",
  "DESCUBRIMIENTO",
] as const;

export type AuditCategory = (typeof AUDIT_CATEGORIES)[number];

export const EVALUATION_METRICS = [
  // RADIO
  "RSSI",
  "SNR",
  "NOISE",
  "CHANNEL_UTILIZATION",
  "NON_WIFI_UTILIZATION",
  "CO_CHANNEL_INTERFERENCE",
  "ADJACENT_CHANNEL_INTERFERENCE",
  "ROGUE_APS",
  // COBERTURA
  "COVERAGE_PASS_RATE",
  "COVERAGE_MIN_RSSI",
  "COVERAGE_MIN_SNR",
  // CONECTIVIDAD
  "ASSOCIATION",
  "DHCP",
  "GATEWAY",
  "DNS",
  "INTERNET",
  "HTTP_HTTPS",
  // RENDIMIENTO
  "DOWNLOAD",
  "UPLOAD",
  "LATENCY",
  "PACKET_LOSS",
  // MOVILIDAD
  "ROAMING",
  // GENERAL
  "OVERALL_RESULT",
] as const;

export type EvaluationMetric = (typeof EVALUATION_METRICS)[number];

export const METRIC_LABELS: Record<string, string> = {
  RSSI: "Señal (RSSI)",
  SNR: "SNR",
  NOISE: "Ruido",
  CHANNEL_UTILIZATION: "Utilización de canal",
  NON_WIFI_UTILIZATION: "Utilización no Wi-Fi",
  CO_CHANNEL_INTERFERENCE: "Interferencia co-canal",
  ADJACENT_CHANNEL_INTERFERENCE: "Interferencia adyacente",
  ROGUE_APS: "APs rogue",
  COVERAGE_PASS_RATE: "Cobertura (puntos conformes)",
  COVERAGE_MIN_RSSI: "Cobertura mínima (RSSI)",
  COVERAGE_MIN_SNR: "Cobertura mínima (SNR)",
  ASSOCIATION: "Asociación",
  DHCP: "DHCP",
  GATEWAY: "Gateway",
  DNS: "DNS",
  INTERNET: "Internet",
  HTTP_HTTPS: "HTTP/HTTPS",
  DOWNLOAD: "Descarga",
  UPLOAD: "Subida",
  LATENCY: "Latencia",
  PACKET_LOSS: "Pérdida de paquetes",
  ROAMING: "Roaming",
  OVERALL_RESULT: "Resultado del equipo",
};

export const EVALUATION_STATUSES = [
  "PASS",
  "WARNING",
  "FAIL",
  "UNKNOWN",
] as const;

export type EvaluationStatus = (typeof EVALUATION_STATUSES)[number];

export const ISSUE_SEVERITIES = [
  "INFO",
  "LOW",
  "MEDIUM",
  "HIGH",
  "CRITICAL",
] as const;

export type IssueSeverity = (typeof ISSUE_SEVERITIES)[number];

export const SEVERITY_ORDER: Record<IssueSeverity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  LOW: 3,
  INFO: 4,
};

export const GLOBAL_RESULTS = [
  "APROBADO",
  "APROBADO_CON_OBSERVACIONES",
  "NO_CONFORME",
  "SIN_DATOS_SUFICIENTES",
] as const;

export type GlobalResult = (typeof GLOBAL_RESULTS)[number];

export const RECOMMENDATION_CATEGORIES = [
  "INMEDIATA",
  "OPTIMIZACION",
  "INFRAESTRUCTURA",
] as const;

export type RecommendationCategory = (typeof RECOMMENDATION_CATEGORIES)[number];

/** Umbrales configurables por perfil de auditoría. */
export interface RangeThreshold {
  /** valor a partir del cual es PASS (mejor cuanto mayor) */
  passMin?: number;
  /** límite inferior del tramo WARNING */
  warnMin?: number;
}

export interface MaxThreshold {
  /** valor máximo para PASS (mejor cuanto menor) */
  passMax?: number;
  /** valor máximo para WARNING; por encima es FAIL */
  warnMax?: number;
}

export interface CountThreshold {
  /** nº máximo de ocurrencias para PASS */
  passMax?: number;
  /** nº máximo para WARNING; por encima FAIL */
  warnMax?: number;
}

export interface CoverageThresholds {
  rssi: RangeThreshold;
  snr: RangeThreshold;
  /** % mínimo de puntos de cobertura que deben ser conformes */
  minPassRatePct?: MaxThreshold;
}

export interface RadioThresholds {
  channelUtilizationPct: MaxThreshold;
  nonWifiUtilizationPct?: MaxThreshold;
  coChannelApCount: CountThreshold;
  adjacentChannelApCount?: CountThreshold;
  /** nº máximo de APs rogue tolerado */
  rogueApsMax?: CountThreshold;
}

export interface PerformanceThresholds {
  minDownloadMbps?: number;
  minUploadMbps?: number;
  maxLatencyMs?: number;
  maxPacketLossPct?: number;
}

export interface AuditThresholds {
  coverage: CoverageThresholds;
  radio: RadioThresholds;
  performance: PerformanceThresholds;
}

export interface ThresholdSnapshot {
  metric: string;
  operator: ">=" | "<=" | "<" | ">" | "==";
  value: number;
  unit?: string;
  extra?: Record<string, unknown>;
}

/** Resultado normalizado producido por el motor de evaluación. */
export interface EvaluationResult {
  category: AuditCategory;
  metric: EvaluationMetric | string;
  value: number | null;
  unit: string | null;
  status: EvaluationStatus;
  threshold?: ThresholdSnapshot;
  message: string;
  sourceType: "MEASURE" | "SURVEY" | "ANALYSIS" | null;
  sourceId: string | null;
  sourceGuid: string | null;
  floorId?: number | null;
  locationLabel?: string | null;
}

export function isKnownStatus(value: unknown): value is AuditStatus {
  return (
    typeof value === "string" &&
    (AUDIT_STATUSES as readonly string[]).includes(value)
  );
}
