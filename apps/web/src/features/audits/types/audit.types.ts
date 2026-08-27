/** Estados del ciclo de vida de una auditoría. */
export type AuditStatus =
  | "BORRADOR"
  | "EN_PROGRESO"
  | "COMPLETADA"
  | "PENDIENTE_DE_REVISION"
  | "INFORME_GENERADO"
  | "ARCHIVADA";

export const AUDIT_STATUS_LABELS: Record<AuditStatus, string> = {
  BORRADOR: "Borrador",
  EN_PROGRESO: "En progreso",
  COMPLETADA: "Completada",
  PENDIENTE_DE_REVISION: "Pendiente de revisión",
  INFORME_GENERADO: "Informe generado",
  ARCHIVADA: "Archivada",
};

export const AUDIT_STATUS_VARIANTS: Record<
  AuditStatus,
  "default" | "secondary" | "success" | "destructive" | "outline"
> = {
  BORRADOR: "outline",
  EN_PROGRESO: "default",
  COMPLETADA: "success",
  PENDIENTE_DE_REVISION: "secondary",
  INFORME_GENERADO: "secondary",
  ARCHIVADA: "destructive",
};

export interface RangeThreshold {
  passMin?: number;
  warnMin?: number;
}

export interface MaxThreshold {
  passMax?: number;
  warnMax?: number;
}

export interface AuditThresholds {
  coverage: {
    rssi: RangeThreshold;
    snr: RangeThreshold;
    minPassRatePct: MaxThreshold;
  };
  radio: {
    channelUtilizationPct: MaxThreshold;
    coChannelApCount: MaxThreshold;
    adjacentChannelApCount: MaxThreshold;
    nonWifiUtilizationPct: MaxThreshold;
    rogueApsMax: MaxThreshold;
  };
  performance: {
    minDownloadMbps: number;
    minUploadMbps: number;
    maxLatencyMs: number;
    maxPacketLossPct: number;
  };
}

export interface AuditProfile {
  id: string;
  name: string;
  auditType: string;
  description: string | null;
  thresholds: AuditThresholds;
  isDefault: boolean;
}

export interface AuditFloor {
  id: number;
  auditId: string;
  name: string;
  order: number;
}

export interface Audit {
  id: string;
  code: string | null;
  name: string;
  client: string | null;
  project: string | null;
  location: string | null;
  address: string | null;
  building: string | null;
  technician: string | null;
  description: string | null;
  objective: string | null;
  scope: string | null;
  methodology: string | null;
  observations: string | null;
  status: AuditStatus;
  auditDate: string | null;
  startDate: string | null;
  endDate: string | null;
  areaKeys: string[];
  ssidFilter: string | null;
  lastSyncAt: string | null;
  profile: AuditProfile | null;
  floors: AuditFloor[];
  createdAt: string;
  updatedAt: string;
}

export interface EvaluationStatusBadgeProps {
  status: EvaluationStatus;
}

export type EvaluationStatus = "PASS" | "WARNING" | "FAIL" | "UNKNOWN";

export type AuditCategory =
  | "COBERTURA"
  | "RADIO"
  | "CONECTIVIDAD"
  | "RENDIMIENTO"
  | "MOVILIDAD";

export interface ThresholdSnapshot {
  metric: string;
  operator: string;
  value: number;
  unit: string | null;
  extra?: Record<string, unknown>;
}

export interface AuditEvaluation {
  id: string;
  category: AuditCategory;
  metric: string;
  value: number | null;
  unit: string | null;
  status: EvaluationStatus;
  threshold: ThresholdSnapshot | null;
  message: string;
  sourceType: string | null;
  sourceId: string | null;
  sourceGuid: string | null;
  floorId: number | null;
  locationLabel: string | null;
  batchId: string;
  runAt: string;
}

export type IssueSeverity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
export type IssueState = "SUGERIDA" | "ACEPTADA" | "MODIFICADA" | "DESCARTADA";

export interface AuditIssue {
  id: string;
  origin: "AUTO" | "MANUAL";
  state: IssueState;
  severity: IssueSeverity;
  title: string;
  description: string | null;
  locationLabel: string | null;
  floorId: number | null;
  metric: string | null;
  value: number | null;
  unit: string | null;
  photo: string | null;
  recommendationText: string | null;
  detectedAt: string;
  updatedAt: string;
}

export type RecommendationCategory =
  | "INMEDIATA"
  | "OPTIMIZACION"
  | "INFRAESTRUCTURA";

export interface AuditRecommendation {
  id: string;
  origin: "AUTO" | "MANUAL";
  category: RecommendationCategory;
  text: string;
  basis: unknown;
  accepted: boolean | null;
  sortOrder: number;
}

export interface AuditConclusion {
  draft: string | null;
  finalText: string | null;
  globalResult:
    | "APROBADO"
    | "APROBADO_CON_OBSERVACIONES"
    | "NO_CONFORME"
    | "SIN_DATOS_SUFICIENTES"
    | null;
  generatedAt: string | null;
  editedAt: string | null;
}

export interface AuditTest {
  id: string;
  section: string;
  key: string;
  title: string;
  required: boolean;
  status: "PENDIENTE" | "COMPLETADA" | "NO_APLICABLE";
  resultStatus: EvaluationStatus | null;
  sourceType: string | null;
  notes: string | null;
  completedAt: string | null;
  sortOrder: number;
}

export interface AuditMembers {
  measures: Array<{
    measure: {
      id: string;
      idLinkLive: string;
      name: string | null;
      fechaHora: string | null;
      overallColor: string | null;
      unitName: string | null;
    };
    measureType?: "iperf" | "wireless";
    label: string | null;
    floorId: number | null;
  }>;
  surveys: Array<{
    survey: {
      id: number;
      idLinkLive: string;
      name: string | null;
      surveyName: string | null;
      surveyPointCount: number;
      hasImage: boolean;
      surveyStartTime: string | null;
    };
    floorId: number | null;
  }>;
  analyses: Array<{
    analysis: {
      id: number;
      idLinkLive: string;
      guid: string | null;
      analysisGuid: string | null;
      name: string | null;
      startTime: string | null;
      apsCount: number | null;
      ssidsCount: number | null;
      clientsCount: number | null;
    };
    floorId: number | null;
  }>;
}

export interface AuditCandidates {
  measures: Array<{
    id: string;
    idLinkLive: string;
    name: string | null;
    createdAt: string;
    overallColor: string | null;
    unitName: string | null;
    measureType?: "iperf" | "wireless";
  }>;
  surveys: Array<{
    id: number;
    idLinkLive: string;
    name: string | null;
    surveyName: string | null;
    surveyPointCount: number;
    surveyStartTime: string | null;
  }>;
  analyses: Array<{
    id: number;
    idLinkLive: string;
    name: string | null;
    startTime: string | null;
    apsCount: number | null;
    ssidsCount: number | null;
    clientsCount: number | null;
  }>;
}

export interface AuditStats {
  totals: {
    audits: number;
    evaluations: {
      PASS: number;
      WARNING: number;
      FAIL: number;
      UNKNOWN: number;
      total: number;
    };
    openIssues: number;
    syncErrors: number;
  };
  byStatus: Record<string, number>;
  recent: Array<{
    id: string;
    name: string;
    code: string | null;
    status: AuditStatus;
    client: string | null;
    createdAt: string;
  }>;
}

export interface AuditComparisonRow {
  id: string;
  name: string;
  code: string | null;
  client: string | null;
  status: AuditStatus;
  createdAt: string;
  globalResult:
    | "APROBADO"
    | "APROBADO_CON_OBSERVACIONES"
    | "NO_CONFORME"
    | "SIN_DATOS_SUFICIENTES"
    | null;
  evaluations: {
    PASS: number;
    WARNING: number;
    FAIL: number;
    UNKNOWN: number;
    total: number;
  };
}

export interface AuditDashboard {
  checklist: {
    total: number;
    required: number;
    completed: number;
    pendingRequired: number;
    pct: number;
    sections: Array<{
      section: string;
      label: string;
      total: number;
      required: number;
      completed: number;
      notApplicable: number;
      failing: number;
      pct: number;
    }>;
  };
  evaluations: {
    PASS: number;
    WARNING: number;
    FAIL: number;
    UNKNOWN: number;
    total: number;
    pctPass: number;
    pctWarning: number;
    pctFail: number;
    lastRunAt: string | null;
  };
  issues: {
    suggested: number;
    accepted?: number;
    active?: number;
    discarded?: number;
    bySeverity: Record<string, number>;
  };
  recommendations: { auto: number; manual: number; accepted: number };
  discovery: { aps: number; ssids: number; clients: number; floors: number };
  conclusion: { globalResult: AuditConclusion["globalResult"] } | null;
  lastSyncAt: string | null;
}

export interface SyncAuditResult {
  measures: { created: number; updated: number; errors: string[] };
  surveys: { created: number; updated: number; errors: string[] };
  analyses: { created: number; updated: number; errors: string[] };
  ok: boolean;
}

export interface DataQualityResult {
  complete: boolean;
  problems: Array<{
    code: string;
    severity: "ERROR" | "WARNING" | "INFO";
    message: string;
    count: number;
  }>;
  stats: { checks: number; [key: string]: unknown };
}
