import { Injectable, Logger } from "@nestjs/common";

import { DatabaseService } from "@core/database/database.service";

export type ExteriorHeatmapTipo = "WIFI" | "LORA";

export interface ExteriorHeatmapPoint {
  lat: number;
  lon: number;
  value: number;
  label: string;
}

export interface ExteriorHeatmapData {
  id: string;
  name: string;
  tipo: ExteriorHeatmapTipo;
  auditId: string | null;
  loraAuditId: string | null;
  points: ExteriorHeatmapPoint[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateExteriorHeatmapInput {
  name: string;
  tipo?: ExteriorHeatmapTipo;
  auditId?: string | null;
  loraAuditId?: string | null;
  points?: ExteriorHeatmapPoint[];
}

export interface UpdateExteriorHeatmapInput {
  name?: string;
  points?: ExteriorHeatmapPoint[] | null;
}

const toFloat = (value: unknown): number | null => {
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
};

@Injectable()
export class ExteriorHeatmapService {
  private readonly logger = new Logger(ExteriorHeatmapService.name);

  constructor(private readonly database: DatabaseService) {}

  private get client() {
    return this.database.getClient();
  }

  async getAll(): Promise<ExteriorHeatmapData[]> {
    const client = this.client;
    if (!client) return [];
    const items = await client.exteriorHeatmap.findMany({
      orderBy: { createdAt: "desc" },
    });
    return items.map((item: any) => this.toData(item));
  }

  async getById(id: string): Promise<ExteriorHeatmapData | null> {
    const client = this.client;
    if (!client) return null;
    const item = await client.exteriorHeatmap.findUnique({ where: { id } });
    if (!item) return null;
    return this.toData(item);
  }

  async getByAudit(auditId: string): Promise<ExteriorHeatmapData[]> {
    const client = this.client;
    if (!client) return [];
    const items = await client.exteriorHeatmap.findMany({
      where: { auditId },
      orderBy: { createdAt: "desc" },
    });
    return items.map((item: any) => this.toData(item));
  }

  async getByLoraAudit(loraAuditId: string): Promise<ExteriorHeatmapData[]> {
    const client = this.client;
    if (!client) return [];
    const items = await client.exteriorHeatmap.findMany({
      where: { loraAuditId },
      orderBy: { createdAt: "desc" },
    });
    return items.map((item: any) => this.toData(item));
  }

  async create(
    input: CreateExteriorHeatmapInput
  ): Promise<ExteriorHeatmapData> {
    const client = this.client;
    if (!client) {
      throw new Error("Base de datos no disponible");
    }
    const tipo = input.tipo ?? "WIFI";
    const item = await client.exteriorHeatmap.create({
      data: {
        name: input.name,
        tipo,
        auditId: input.auditId ?? null,
        loraAuditId: input.loraAuditId ?? null,
        points: this.sanitizePoints(input.points ?? []),
      },
    });
    return this.toData(item);
  }

  async createFromAudit(auditId: string): Promise<ExteriorHeatmapData> {
    const client = this.client;
    if (!client) {
      throw new Error("Base de datos no disponible");
    }
    const points = await this.buildPointsFromAudit(auditId);
    const name = `Mapa exterior auditoría ${auditId}`;
    const tipo: ExteriorHeatmapTipo = "WIFI";
    const item = await client.exteriorHeatmap.create({
      data: {
        name,
        tipo,
        auditId,
        loraAuditId: null,
        points: this.sanitizePoints(points),
      },
    });
    return this.toData(item);
  }

  async createFromLoraAudit(loraAuditId: string): Promise<ExteriorHeatmapData> {
    const client = this.client;
    if (!client) {
      throw new Error("Base de datos no disponible");
    }
    const points = await this.buildPointsFromLoraAudit(loraAuditId);
    const name = `Mapa exterior auditoría LoRa ${loraAuditId}`;
    const tipo: ExteriorHeatmapTipo = "LORA";
    const item = await client.exteriorHeatmap.create({
      data: {
        name,
        tipo,
        auditId: null,
        loraAuditId,
        points: this.sanitizePoints(points),
      },
    });
    return this.toData(item);
  }

  async update(
    id: string,
    input: UpdateExteriorHeatmapInput
  ): Promise<ExteriorHeatmapData | null> {
    const client = this.client;
    if (!client) return null;
    const existing = await client.exteriorHeatmap.findUnique({ where: { id } });
    if (!existing) return null;
    const item = await client.exteriorHeatmap.update({
      where: { id },
      data: {
        name: input.name !== undefined ? input.name : undefined,
        points:
          input.points !== undefined
            ? this.sanitizePoints(input.points ?? [])
            : undefined,
      },
    });
    return this.toData(item);
  }

  async remove(id: string): Promise<boolean> {
    const client = this.client;
    if (!client) return false;
    const existing = await client.exteriorHeatmap.findUnique({ where: { id } });
    if (!existing) return false;
    await client.exteriorHeatmap.delete({ where: { id } });
    return true;
  }

  private async buildPointsFromAudit(
    auditId: string
  ): Promise<ExteriorHeatmapPoint[]> {
    const client = this.client;
    if (!client) return [];
    const links = await client.auditMeasure.findMany({
      where: { auditId },
      include: { measure: true },
    });
    const points: ExteriorHeatmapPoint[] = [];
    for (const link of links ?? []) {
      const measure = link?.measure;
      if (!measure) continue;
      const lat = toFloat(measure.lat);
      const lon = toFloat(measure.lon);
      if (lat === null || lon === null) continue;
      const raw = measure.raw ?? {};
      const value =
        toFloat(raw.linkSignalLevelMean) ?? toFloat(raw.linkSNRMean) ?? 0;
      points.push({
        lat,
        lon,
        value,
        label: measure.name ?? measure.areaGeogr ?? "",
      });
    }
    return points;
  }

  private async buildPointsFromLoraAudit(
    loraAuditId: string
  ): Promise<ExteriorHeatmapPoint[]> {
    const client = this.client;
    if (!client) return [];
    const loraAudit = await client.loraAudit.findUnique({
      where: { id: loraAuditId },
      include: {
        measureLinks: { include: { measure: true } },
        noiseLinks: { include: { noise: true } },
        floorPlan: true,
      },
    });
    if (!loraAudit) return [];
    const points: ExteriorHeatmapPoint[] = [];

    for (const link of loraAudit.measureLinks ?? []) {
      const measure = link.measure;
      const blocks = Array.isArray(measure?.blocks) ? measure.blocks : [];
      for (const block of blocks ?? []) {
        const lat = toFloat(block.latitude);
        const lon = toFloat(block.longitude);
        if (lat === null || lon === null) continue;
        const rssi = toFloat(block.rssi);
        const snr = toFloat(block.snr);
        points.push({
          lat,
          lon,
          value: rssi ?? snr ?? 0,
          label: block.location ?? "Medida LoRa",
        });
      }
    }

    for (const link of loraAudit.noiseLinks ?? []) {
      const noise = link.noise;
      const noiseLat = toFloat(noise?.latitude);
      const noiseLon = toFloat(noise?.longitude);
      if (noiseLat === null || noiseLon === null) continue;
      const entries = Array.isArray(noise?.entries) ? noise.entries : [];
      const first = entries[0] ?? {};
      const value =
        toFloat(first.weightedAverageScan) ?? toFloat(first.currentScan) ?? 0;
      points.push({
        lat: noiseLat,
        lon: noiseLon,
        value,
        label: noise?.location ?? "Ruido LoRa",
      });
    }

    return points;
  }

  private sanitizePoints(
    points: ExteriorHeatmapPoint[]
  ): ExteriorHeatmapPoint[] {
    if (!Array.isArray(points)) return [];
    return points
      .map((p) => {
        const lat = toFloat(p?.lat);
        const lon = toFloat(p?.lon);
        const value = toFloat(p?.value);
        if (lat === null || lon === null) return null;
        return { lat, lon, value: value ?? 0, label: String(p?.label ?? "") };
      })
      .filter((p): p is ExteriorHeatmapPoint => p !== null);
  }

  private toData(item: any): ExteriorHeatmapData {
    return {
      id: item.id,
      name: item.name,
      tipo: item.tipo === "LORA" ? "LORA" : "WIFI",
      auditId: item.auditId ?? null,
      loraAuditId: item.loraAuditId ?? null,
      points: Array.isArray(item.points) ? item.points : [],
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    };
  }
}
