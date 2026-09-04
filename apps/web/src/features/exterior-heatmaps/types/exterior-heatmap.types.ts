export type ExteriorHeatmapTipo = "WIFI" | "LORA";

export interface ExteriorHeatmapPoint {
  lat: number;
  lon: number;
  value: number;
  label: string;
}

export interface ExteriorHeatmap {
  id: string;
  name: string;
  tipo: ExteriorHeatmapTipo;
  auditId: string | null;
  loraAuditId: string | null;
  points: ExteriorHeatmapPoint[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateExteriorHeatmapPayload {
  name: string;
  tipo?: ExteriorHeatmapTipo;
  auditId?: string | null;
  loraAuditId?: string | null;
  points?: ExteriorHeatmapPoint[];
}

export interface UpdateExteriorHeatmapPayload {
  name?: string;
  points?: ExteriorHeatmapPoint[] | null;
}
