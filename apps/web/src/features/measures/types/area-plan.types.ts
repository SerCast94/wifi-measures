export interface AreaPlanPosition {
  x: number;
  y: number;
}

export interface AreaPlanHeatmapPoint {
  x: number;
  y: number;
  value: number | null;
}

export interface AreaPlanHeatmap {
  source?: string;
  surveyId?: string | null;
  surveyName?: string | null;
  metric?: string;
  unit?: string;
  points: AreaPlanHeatmapPoint[];
}

export interface AreaPlan {
  id: number;
  areaId: number;
  name: string;
  image: string;
  width: number;
  height: number;
  positions: Record<string, AreaPlanPosition> | null;
  heatmap: AreaPlanHeatmap | null;
}

export interface UpsertAreaPlanPayload {
  name: string;
  image: string;
  width: number;
  height: number;
  positions: Record<string, AreaPlanPosition>;
}