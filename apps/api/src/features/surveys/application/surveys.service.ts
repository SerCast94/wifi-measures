import { Injectable, Logger } from "@nestjs/common";

import { LinkLiveService } from "@core/linklive/linklive.service";
import { DatabaseService } from "@core/database/database.service";
import { AreaPlanService } from "@features/measures/application/area-plan.service";
import { SURVEY_METRICS } from "@features/surveys/domain/survey-metrics";

interface SyncMetric {
  key: string;
  valueKey: string;
  hostType: string;
}

@Injectable()
export class SurveysService {
  private readonly logger = new Logger(SurveysService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly linkLiveService: LinkLiveService,
    private readonly areaPlanService: AreaPlanService
  ) {}

  private get client() {
    return this.database.getClient();
  }

  async getAll() {
    const client = this.client;
    if (!client) return [];

    return client.linkLiveSurvey.findMany({
      orderBy: { surveyStartTime: "desc" },
    });
  }

  async getById(id: string) {
    const client = this.client;
    if (!client) return null;

    const surveyId = Number(id);
    if (!Number.isFinite(surveyId)) return null;

    const survey = await client.linkLiveSurvey.findUnique({
      where: { id: surveyId },
    });
    if (!survey) return null;

    const points = await client.linkLiveSurveyPoint.findMany({
      where: { surveyId: survey.id },
    });

    return { survey, points };
  }

  async sync() {
    const heatmaps = await this.linkLiveService.listHeatmaps();
    const synced = [];

    for (const heatmap of heatmaps) {
      try {
        const saved = await this.syncOne(heatmap);
        if (saved) synced.push(saved);
      } catch (error: any) {
        this.logger.warn(
          `No se pudo sincronizar la encuesta ${heatmap?._id}: ${
            error?.message ?? error
          }`
        );
      }
    }

    return synced;
  }

  private async syncOne(heatmap: any) {
    const id = heatmap?._id;
    if (!id) return null;

    let detail: any = heatmap;
    try {
      detail = await this.linkLiveService.getHeatmap(id);
    } catch {
      // se usa el heatmap de la lista si falla el detalle
    }

    const scaledWidth =
      detail.floorPlanScaledWidthPx ?? detail.floorPlanWidthPx ?? 0;
    const scaledHeight =
      detail.floorPlanScaledHeightPx ?? detail.floorPlanHeightPx ?? 0;

    let image: string | null = null;
    try {
      const floors = await this.linkLiveService.listHeatmapFloorplans(id);
      const floor =
        floors.find((f) => f.fileName === detail.floorPlanFilename) ??
        floors[0];
      if (floor?.href) {
        const base64 = await this.linkLiveService.downloadImage(floor.href);
        image = `data:image/png;base64,${base64}`;
      }
    } catch (error: any) {
      this.logger.warn(
        `No se pudo descargar el plano de ${id}: ${error?.message ?? error}`
      );
    }

    const metrics: SyncMetric[] = [
      { key: "signal", valueKey: "signal", hostType: "passive" },
      { key: "snr", valueKey: "snr", hostType: "passive" },
    ];
    if (detail.surveyActive1x1) {
      metrics.push({ key: "oneXone", valueKey: "signal", hostType: "oneXone" });
    }
    if (detail.surveyBluetooth) {
      metrics.push({
        key: "bluetooth",
        valueKey: "signal",
        hostType: "bluetooth",
      });
    }
    metrics.push({ key: "client", valueKey: "signal", hostType: "client" });
    metrics.push({
      key: "probingClient",
      valueKey: "signal",
      hostType: "probingClient",
    });

    const points: any[] = [];
    for (const metric of metrics) {
      try {
        const data = await this.linkLiveService.getHeatmapDisplayData(
          id,
          metric.valueKey,
          metric.hostType
        );
        const mapped = (data ?? []).map((point) => ({
          metric: metric.key,
          pointIdx: point.pointIdx ?? 0,
          x:
            scaledWidth > 0
              ? this.clamp(((Number(point.x) ?? 0) / scaledWidth) * 100)
              : 0,
          y:
            scaledHeight > 0
              ? this.clamp(((Number(point.y) ?? 0) / scaledHeight) * 100)
              : 0,
          value:
            typeof point.value === "number" && Number.isFinite(point.value)
              ? point.value
              : null,
          time: point.time ?? null,
        }));
        points.push(...mapped);
      } catch (error: any) {
        this.logger.warn(
          `No se pudo obtener ${metric.key} de ${id}: ${
            error?.message ?? error
          }`
        );
      }
    }

    const client = this.client;
    if (!client) {
      throw new Error("Base de datos no disponible");
    }

    const payload = {
      idLinkLive: id,
      name: this.stringOrNull(detail.fileName),
      surveyName: this.stringOrNull(detail.surveyName),
      surveyDescription: this.stringOrNull(detail.surveyDescription),
      surveyMode: this.stringOrNull(detail.surveyMode),
      surveyPointCount: detail.surveyPointCount ?? 0,
      surveyBluetooth: Boolean(detail.surveyBluetooth),
      surveyActive1x1: Boolean(detail.surveyActive1x1),
      ssid1x1: this.stringOrNull(detail.ssid1x1),
      unitId: this.stringOrNull(detail.unitId),
      unitName: this.stringOrNull(detail.unitName),
      unitMac: this.stringOrNull(detail.unitMac),
      unitSerial: this.stringOrNull(detail.unitSerial),
      unitType: this.stringOrNull(detail.unitType),
      unitHardware: this.stringOrNull(detail.unitHardware),
      status: this.stringOrNull(detail.status),
      fileType: this.stringOrNull(detail.fileType),
      floorPlanFilename: this.stringOrNull(detail.floorPlanFilename),
      floorPlanWidth: detail.floorPlanWidthPx ?? 0,
      floorPlanHeight: detail.floorPlanHeightPx ?? 0,
      floorPlanScalePpf: detail.floorPlanScalePpf ?? 0,
      floorPlanScaledWidth: scaledWidth,
      floorPlanScaledHeight: scaledHeight,
      analysisGuid: this.stringOrNull(detail.analysisGuid),
      surveyStartTime: this.dateOrNull(
        detail.surveyStartTime ?? detail.startTimeLocal
      ),
      image,
    };

    const existing = await client.linkLiveSurvey.findUnique({
      where: { idLinkLive: id },
    });

    if (!image && existing?.image) {
      payload.image = existing.image;
    }

    let saved: any;
    if (existing) {
      saved = await client.linkLiveSurvey.update({
        where: { id: existing.id },
        data: payload,
      });
      await client.linkLiveSurveyPoint.deleteMany({
        where: { surveyId: existing.id },
      });
    } else {
      saved = await client.linkLiveSurvey.create({ data: payload });
    }

    if (points.length > 0) {
      await client.linkLiveSurveyPoint.createMany({
        data: points.map((point: any) => ({ ...point, surveyId: saved.id })),
      });
    }

    return saved;
  }

  async importToArea(surveyId: string, areaId: string) {
    const client = this.client;
    if (!client) {
      throw new Error("Base de datos no disponible");
    }

    const numericSurveyId = Number(surveyId);
    if (!Number.isFinite(numericSurveyId)) {
      throw new Error("Encuesta no encontrada");
    }

    const survey = await client.linkLiveSurvey.findUnique({
      where: { id: numericSurveyId },
    });
    if (!survey) {
      throw new Error("Encuesta no encontrada");
    }

    const points = await client.linkLiveSurveyPoint.findMany({
      where: { surveyId: survey.id },
    });

    const metrics = SURVEY_METRICS.map((metric) => ({
      ...metric,
      points: points.filter(
        (point: { metric: string }) => point.metric === metric.key
      ),
    })).filter((metric) => metric.points.length > 0);

    const metric =
      metrics.find((m) => m.key === "signal" && m.points.length > 0) ??
      metrics[0];

    if (!metric || metric.points.length === 0 || !survey.image) {
      throw new Error(
        "La encuesta no tiene datos suficientes para importar a un área"
      );
    }

    const heatmap = {
      source: "linklive",
      surveyId: survey.idLinkLive,
      surveyName: survey.name ?? survey.surveyName,
      metric: metric.key,
      unit: metric.unit,
      points: metric.points.map(
        (point: { x: number; y: number; value: number | null }) => ({
          x: point.x,
          y: point.y,
          value: point.value,
        })
      ),
    };

    return this.areaPlanService.upsert(Number(areaId), {
      name: survey.name ?? survey.surveyName ?? "Plano importado",
      image: survey.image,
      width: survey.floorPlanScaledWidth || survey.floorPlanWidth,
      height: survey.floorPlanScaledHeight || survey.floorPlanHeight,
      positions: {},
      heatmap,
    });
  }

  private clamp(value: number): number {
    return Math.min(100, Math.max(0, value));
  }

  private stringOrNull(value: unknown): string | null {
    if (typeof value === "string" && value.length > 0) return value;
    return null;
  }

  private dateOrNull(value: unknown): Date | null {
    if (typeof value !== "string" && !(value instanceof Date)) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}
