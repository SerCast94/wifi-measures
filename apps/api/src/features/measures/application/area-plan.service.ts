import { Injectable, Logger } from "@nestjs/common";

import { DatabaseService } from "@core/database/database.service";

export interface AreaPlanPosition {
  x: number;
  y: number;
}

export interface AreaPlanHeatmap {
  source?: string;
  surveyId?: string | null;
  surveyName?: string | null;
  metric?: string;
  unit?: string;
  points: { x: number; y: number; value: number | null }[];
}

export interface AreaPlanData {
  id: number;
  areaId: number;
  name: string;
  image: string;
  width: number;
  height: number;
  positions: Record<string, AreaPlanPosition> | null;
  heatmap: AreaPlanHeatmap | null;
}

export interface UpsertAreaPlanInput {
  name: string;
  image: string;
  width: number;
  height: number;
  positions?: Record<string, AreaPlanPosition>;
  heatmap?: AreaPlanHeatmap | null;
}

@Injectable()
export class AreaPlanService {
  private readonly logger = new Logger(AreaPlanService.name);

  constructor(private readonly database: DatabaseService) {}

  private get client() {
    return this.database.getClient();
  }

  async getByAreaId(areaId: number): Promise<AreaPlanData | null> {
    const client = this.client;
    if (!client) return null;

    const plan = await client.areaPlan.findUnique({ where: { areaId } });
    if (!plan) return null;

    return {
      id: plan.id,
      areaId: plan.areaId,
      name: plan.name,
      image: plan.image,
      width: plan.width,
      height: plan.height,
      positions:
        (plan.positions as Record<string, AreaPlanPosition> | null) ?? null,
      heatmap: (plan.heatmap as AreaPlanHeatmap | null) ?? null,
    };
  }

  async upsert(
    areaId: number,
    data: UpsertAreaPlanInput
  ): Promise<AreaPlanData | null> {
    const client = this.client;
    if (!client) {
      throw new Error("Base de datos no disponible");
    }

    const positions = this.sanitizePositions(data.positions);
    const heatmap = this.sanitizeHeatmap(data.heatmap);

    await client.areaPlan.upsert({
      where: { areaId },
      create: {
        areaId,
        name: data.name,
        image: data.image,
        width: data.width,
        height: data.height,
        positions,
        heatmap,
      },
      update: {
        name: data.name,
        image: data.image,
        width: data.width,
        height: data.height,
        positions,
        heatmap,
      },
    });

    return this.getByAreaId(areaId);
  }

  private sanitizeHeatmap(
    heatmap?: AreaPlanHeatmap | null
  ): AreaPlanHeatmap | null {
    if (!heatmap || typeof heatmap !== "object") {
      return null;
    }

    const points = Array.isArray(heatmap.points)
      ? heatmap.points
          .map((point) => {
            const x = Number(point?.x);
            const y = Number(point?.y);
            if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
            const value =
              typeof point?.value === "number" && Number.isFinite(point.value)
                ? point.value
                : null;
            return {
              x: Math.min(100, Math.max(0, x)),
              y: Math.min(100, Math.max(0, y)),
              value,
            };
          })
          .filter(
            (point): point is { x: number; y: number; value: number | null } =>
              point !== null
          )
      : [];

    return {
      source: heatmap.source ?? "linklive",
      surveyId: heatmap.surveyId ?? null,
      surveyName: heatmap.surveyName ?? null,
      metric: heatmap.metric ?? "signal",
      unit: heatmap.unit ?? "",
      points,
    };
  }

  private sanitizePositions(
    positions?: Record<string, AreaPlanPosition>
  ): Record<string, AreaPlanPosition> {
    const result: Record<string, AreaPlanPosition> = {};

    if (!positions || typeof positions !== "object") {
      return result;
    }

    for (const [key, value] of Object.entries(positions)) {
      if (!value || typeof value !== "object") continue;
      const x = Number((value as AreaPlanPosition).x);
      const y = Number((value as AreaPlanPosition).y);
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      result[key] = {
        x: Math.min(100, Math.max(0, x)),
        y: Math.min(100, Math.max(0, y)),
      };
    }

    return result;
  }
}
