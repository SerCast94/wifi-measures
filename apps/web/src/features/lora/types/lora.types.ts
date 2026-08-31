export type LoraAuditStatus =
  | "BORRADOR"
  | "EN_PROGRESO"
  | "COMPLETADA"
  | "PENDIENTE_DE_REVISION"
  | "INFORME_GENERADO"
  | "ARCHIVADA";

export const LORA_AUDIT_STATUS_LABELS: Record<LoraAuditStatus, string> = {
  BORRADOR: "Borrador",
  EN_PROGRESO: "En progreso",
  COMPLETADA: "Completada",
  PENDIENTE_DE_REVISION: "Pendiente de revisión",
  INFORME_GENERADO: "Informe generado",
  ARCHIVADA: "Archivada",
};

export const LORA_AUDIT_STATUS_VARIANTS: Record<
  LoraAuditStatus,
  "default" | "secondary" | "success" | "destructive" | "outline"
> = {
  BORRADOR: "outline",
  EN_PROGRESO: "default",
  COMPLETADA: "success",
  PENDIENTE_DE_REVISION: "secondary",
  INFORME_GENERADO: "secondary",
  ARCHIVADA: "destructive",
};

export interface LoraMeasureBlock {
  role: string | null;
  totalPackets: number | null;
  successfulPackets: number | null;
  rssi: number | null;
  snr: number | null;
  packetLossPct: number | null;
  longitude: number | null;
  latitude: number | null;
  location: string | null;
}

export interface LoraMeasure {
  id: number;
  location: string | null;
  time: string | null;
  spreadingFactor: string | null;
  txPower: string | null;
  blocks: LoraMeasureBlock[];
  createdAt: string;
  updatedAt: string;
}

export interface LoraNoiseEntry {
  frequency: number | null;
  currentScan: number | null;
  weightedAverageScan: number | null;
}

export interface LoraNoise {
  id: number;
  location: string | null;
  longitude: number | null;
  latitude: number | null;
  entries: LoraNoiseEntry[];
  createdAt: string;
  updatedAt: string;
}

export interface LoraAudit {
  id: string;
  code: string | null;
  name: string;
  client: string | null;
  project: string | null;
  location: string | null;
  technician: string | null;
  description: string | null;
  objective: string | null;
  status: LoraAuditStatus;
  auditDate: string | null;
  startDate: string | null;
  endDate: string | null;
  measure: LoraMeasure | null;
  noise: LoraNoise | null;
  createdAt: string;
  updatedAt: string;
}

export type LoraEvalStatus = "PASS" | "WARNING" | "FAIL" | "UNKNOWN";

export interface LoraEvaluationItem {
  category: string;
  metric: string;
  value: number | null;
  unit: string | null;
  status: LoraEvalStatus;
  label: string | null;
  message: string;
}

export interface LoraCoherence {
  case: string;
  title: string;
  status: LoraEvalStatus;
  message: string;
  recommendation: string;
}

export interface LoraAnalysisSummary {
  total: number;
  byStatus: Record<LoraEvalStatus, number>;
  pctPass: number;
  globalResult: string;
  paragraphs: string[];
  recommendations: string[];
}

export interface LoraAnalysis {
  batchId: string;
  runAt: string;
  evaluations: LoraEvaluationItem[];
  summary: LoraAnalysisSummary;
  coherence: LoraCoherence[];
}

export interface LoraAnalysisChartBlock {
  role: string | null;
  rssi: number | null;
  snr: number | null;
  packetLossPct: number | null;
  totalPackets: number | null;
}

export interface LoraAnalysisChartNoise {
  frequency: number | null;
  currentScan: number | null;
  weightedAverageScan: number | null;
}

export interface LoraAnalysisData {
  blocks: LoraAnalysisChartBlock[];
  noise: LoraAnalysisChartNoise[];
}

export const LORA_EVAL_STATUS_LABELS: Record<LoraEvalStatus, string> = {
  PASS: "Conforme",
  WARNING: "En el límite",
  FAIL: "No conforme",
  UNKNOWN: "No disponible",
};

export const LORA_GLOBAL_RESULT_LABELS: Record<string, string> = {
  APROBADO: "Aprobado",
  APROBADO_CON_OBSERVACIONES: "Aprobado con observaciones",
  NO_CONFORME: "No conforme",
  SIN_DATOS_SUFICIENTES: "Sin datos suficientes",
};
