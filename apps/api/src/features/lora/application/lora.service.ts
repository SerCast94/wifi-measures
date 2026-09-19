import { Injectable, Logger, NotFoundException } from "@nestjs/common";

import { DatabaseService } from "@core/database/database.service";
import { ExteriorHeatmapService } from "@features/exterior-heatmaps/application/exterior-heatmap.service";

export interface LoraSampleInput {
  txCnt?: number | null;
  time?: string | null;
  rssi?: number | null;
  rssis?: number | null;
  snr?: number | null;
  signal?: string | null;
  uplinkPacket?: number | null;
  confirmPacket?: number | null;
  packetLossPct?: number | null;
  longitude?: number | null;
  latitude?: number | null;
  location?: string | null;
  sf?: string | null;
  txPower?: string | null;
}

export interface CreateLoraMeasureInput {
  source?: string | null;
  location?: string | null;
  time?: string | null;
  spreadingFactor?: string | null;
  txPower?: string | null;
  samples?: LoraSampleInput[];
}

export interface LoraNoiseEntryInput {
  frequency?: number | null;
  currentScan?: number | null;
  weightedAverageScan?: number | null;
}

export interface CreateLoraNoiseInput {
  location?: string | null;
  longitude?: number | null;
  latitude?: number | null;
  entries?: LoraNoiseEntryInput[];
}

export interface LoraAntennaPoint {
  lat: number;
  lon: number;
}

export interface CreateLoraAuditInput {
  name: string;
  code?: string | null;
  client?: string | null;
  project?: string | null;
  location?: string | null;
  technician?: string | null;
  description?: string | null;
  objective?: string | null;
  auditDate?: Date | null;
  startDate?: Date | null;
  endDate?: Date | null;
  measureIds?: number[];
  noiseIds?: number[];
  floorPlanId?: number | null;
  heatmapRadius?: number | null;
  antenna?: LoraAntennaPoint | null;
  /**
   * Resultado de conformidad seleccionado manualmente:
   * CONFORME | CONFORME_CON_ANOTACIONES | NO_CONFORME | null (sin definir).
   */
  result?: string | null;
}

export type UpdateLoraAuditInput = Partial<CreateLoraAuditInput>;

/** Ordena medidas/ruidos por nombre de ubicación (nulls al final). */
const byLocation = (
  a: { location?: string | null },
  b: { location?: string | null }
): number => {
  const la = (a.location ?? "").trim().toLowerCase();
  const lb = (b.location ?? "").trim().toLowerCase();
  if (!la && !lb) return 0;
  if (!la) return 1;
  if (!lb) return -1;
  return la.localeCompare(lb, "es", { numeric: true, sensitivity: "base" });
};

@Injectable()
export class LoraService {
  private readonly logger = new Logger(LoraService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly exteriorHeatmapService: ExteriorHeatmapService
  ) {}

  private get client() {
    return this.database.getClient();
  }

  // ---------- Medidas ----------

  async createMeasures(inputs: CreateLoraMeasureInput[]) {
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    const rows = Array.isArray(inputs) ? inputs : [];
    const created: any[] = [];
    for (const input of rows) {
      const samples = (
        Array.isArray(input.samples) ? input.samples : []
      ).filter((sample): sample is LoraSampleInput =>
        Boolean(sample && typeof sample === "object")
      );
      const record = await client.loraMeasure.create({
        data: {
          source: input.source ?? null,
          location: input.location ?? null,
          time: input.time ?? null,
          spreadingFactor: input.spreadingFactor ?? null,
          txPower: input.txPower ?? null,
          samples: {
            create: samples.map((sample) => ({
              txCnt: sample.txCnt ?? null,
              time: sample.time ?? null,
              rssi: sample.rssi ?? null,
              rssis: sample.rssis ?? null,
              snr: sample.snr ?? null,
              signal: sample.signal ?? null,
              uplinkPacket: sample.uplinkPacket ?? null,
              confirmPacket: sample.confirmPacket ?? null,
              packetLossPct: sample.packetLossPct ?? null,
              longitude: sample.longitude ?? null,
              latitude: sample.latitude ?? null,
              location: sample.location ?? null,
              sf: sample.sf ?? null,
              txPower: sample.txPower ?? null,
            })),
          },
        },
        include: { samples: true },
      });
      created.push(record);
    }
    return created;
  }

  async listMeasures() {
    const client = this.client;
    if (!client) return [];
    const rows = await client.loraMeasure.findMany({
      orderBy: { createdAt: "desc" },
      include: { samples: true },
    });
    return rows.sort(byLocation);
  }

  async clearMeasures() {
    const client = this.client;
    if (!client) return { ok: true };
    await client.loraMeasure.deleteMany({});
    return { ok: true };
  }

  async deleteMeasure(id: number) {
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    await client.loraMeasure.delete({ where: { id } });
    return { ok: true };
  }

  /**
   * Actualiza la posición de una medida: como todas sus muestras comparten
   * coordenada (1 CSV = 1 ubicación), se actualizan todas a la vez.
   */
  async updateMeasureLocation(id: number, latitude: number, longitude: number) {
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    await client.loraSample.updateMany({
      where: { measureId: id },
      data: { latitude, longitude },
    });
    return client.loraMeasure.findUnique({
      where: { id },
      include: { samples: true },
    });
  }

  // ---------- Ruido ----------

  async createNoise(inputs: CreateLoraNoiseInput[]) {
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    const rows = Array.isArray(inputs) ? inputs : [];
    const created: any[] = [];
    for (const input of rows) {
      const record = await client.loraNoise.create({
        data: {
          location: input.location ?? null,
          longitude: input.longitude ?? null,
          latitude: input.latitude ?? null,
          entries: Array.isArray(input.entries) ? input.entries : [],
        },
      });
      created.push(record);
    }
    return created;
  }

  async listNoise() {
    const client = this.client;
    if (!client) return [];
    const rows = await client.loraNoise.findMany({
      orderBy: { createdAt: "desc" },
    });
    return rows.sort(byLocation);
  }

  async clearNoise() {
    const client = this.client;
    if (!client) return { ok: true };
    await client.loraNoise.deleteMany({});
    return { ok: true };
  }

  async deleteNoise(id: number) {
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    await client.loraNoise.delete({ where: { id } });
    return { ok: true };
  }

  async updateNoiseLocation(id: number, latitude: number, longitude: number) {
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    return client.loraNoise.update({
      where: { id },
      data: { latitude, longitude },
    });
  }

  // ---------- Auditorías ----------

  async listAudits(params: { page?: number; size?: number; q?: string }) {
    const client = this.client;
    if (!client) return { items: [], total: 0 };

    const page = Math.max(1, params.page ?? 1);
    const size = Math.min(100, Math.max(1, params.size ?? 20));
    const where: Record<string, unknown> = {};
    if (params.q) {
      where.OR = [
        { name: { contains: params.q, mode: "insensitive" } },
        { client: { contains: params.q, mode: "insensitive" } },
        { location: { contains: params.q, mode: "insensitive" } },
      ];
    }

    const [total, items] = await Promise.all([
      client.loraAudit.count({ where }),
      client.loraAudit.findMany({
        where,
        include: this.auditInclude(),
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * size,
        take: size,
      }),
    ]);

    return {
      items: items.map((a: object) => this.toAuditView(a)),
      total,
      page,
      size,
    };
  }

  private auditInclude() {
    return {
      measureLinks: { include: { measure: { include: { samples: true } } } },
      noiseLinks: { include: { noise: true } },
      floorPlan: true,
    };
  }

  private toAuditView<T extends object>(audit: T) {
    const raw = audit as unknown as Record<string, any>;
    return {
      ...audit,
      measures: (raw.measureLinks ?? [])
        .map((l: any) => l.measure)
        .sort(byLocation),
      noise: (raw.noiseLinks ?? []).map((l: any) => l.noise).sort(byLocation),
      measureLinks: undefined,
      noiseLinks: undefined,
    } as T & {
      measures: any[];
      noise: any[];
      measureLinks: undefined;
      noiseLinks: undefined;
    };
  }

  async getAuditById(id: string) {
    const client = this.client;
    if (!client) return null;
    const audit = await client.loraAudit.findUnique({
      where: { id },
      include: this.auditInclude(),
    });
    return audit ? this.toAuditView(audit) : null;
  }

  async getAuditByIdOrThrow(id: string) {
    const audit = await this.getAuditById(id);
    if (!audit) throw new NotFoundException("Auditoría LoRa no encontrada");
    return audit;
  }

  async createAudit(input: CreateLoraAuditInput) {
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");

    const created = await client.loraAudit.create({
      data: {
        name: input.name,
        code: input.code ?? null,
        client: input.client ?? null,
        project: input.project ?? null,
        location: input.location ?? null,
        technician: input.technician ?? null,
        description: input.description ?? null,
        objective: input.objective ?? null,
        auditDate: input.auditDate ?? new Date(),
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        floorPlanId: input.floorPlanId ?? null,
        heatmapRadius: input.heatmapRadius ?? 0.16,
        antenna: input.antenna ?? null,
        result: input.result ?? null,
        measureLinks: {
          create: (input.measureIds ?? []).map((measureId) => ({ measureId })),
        },
        noiseLinks: {
          create: (input.noiseIds ?? []).map((noiseId) => ({ noiseId })),
        },
      },
    });
    const audit = await this.getAuditByIdOrThrow(created.id);
    if (audit.floorPlanId) {
      this.exteriorHeatmapService
        .createFromLoraAudit(created.id)
        .catch((err: unknown) =>
          this.logger.warn(
            `No se pudo sincronizar el mapa exterior: ${this.errMessage(err)}`
          )
        );
    }
    return audit;
  }

  async updateAudit(id: string, input: UpdateLoraAuditInput) {
    await this.getAuditByIdOrThrow(id);
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");

    const data: Record<string, unknown> = {};
    for (const key of Object.keys(input) as Array<keyof CreateLoraAuditInput>) {
      if (key === "measureIds" || key === "noiseIds") continue;
      if (input[key] !== undefined) data[key] = input[key];
    }
    if (Object.keys(data).length > 0) {
      await client.loraAudit.update({ where: { id }, data });
    }

    if (input.measureIds !== undefined) {
      await client.loraAuditMeasure.deleteMany({ where: { auditId: id } });
      if (input.measureIds.length > 0) {
        await client.loraAuditMeasure.createMany({
          data: input.measureIds.map((measureId) => ({
            auditId: id,
            measureId,
          })),
        });
      }
    }
    if (input.noiseIds !== undefined) {
      await client.loraAuditNoise.deleteMany({ where: { auditId: id } });
      if (input.noiseIds.length > 0) {
        await client.loraAuditNoise.createMany({
          data: input.noiseIds.map((noiseId) => ({ auditId: id, noiseId })),
        });
      }
    }

    const audit = await this.getAuditByIdOrThrow(id);
    if (audit.floorPlanId) {
      this.exteriorHeatmapService
        .createFromLoraAudit(id)
        .catch((err: unknown) =>
          this.logger.warn(
            `No se pudo sincronizar el mapa exterior: ${this.errMessage(err)}`
          )
        );
    }
    return audit;
  }

  private errMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    return String(err);
  }

  async updateAuditStatus(id: string, status: string) {
    await this.getAuditByIdOrThrow(id);
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    return client.loraAudit.update({ where: { id }, data: { status } });
  }

  /** Guarda la posición manual de la antena (gateway/emisor) sobre el plano. */
  async updateAuditAntenna(id: string, latitude: number, longitude: number) {
    await this.getAuditByIdOrThrow(id);
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    await client.loraAudit.update({
      where: { id },
      data: { antenna: { lat: latitude, lon: longitude } },
    });
    return this.getAuditByIdOrThrow(id);
  }

  /** Establece a mano el resultado de conformidad de la auditoría (null = limpiar). */
  async updateAuditResult(id: string, result: string | null) {
    await this.getAuditByIdOrThrow(id);
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    await client.loraAudit.update({
      where: { id },
      data: { result: result === "" ? null : result },
    });
    return this.getAuditByIdOrThrow(id);
  }

  async removeAudit(id: string) {
    await this.getAuditByIdOrThrow(id);
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    await client.loraAudit.delete({ where: { id } });
    return { ok: true };
  }

  // ---------- Estadísticas ----------

  async getStats() {
    const client = this.client;
    const emptyEvaluations = {
      PASS: 0,
      WARNING: 0,
      FAIL: 0,
      UNKNOWN: 0,
      total: 0,
    };
    if (!client)
      return {
        totals: {
          audits: 0,
          evaluations: emptyEvaluations,
          measures: 0,
          noise: 0,
          auditsWithoutData: 0,
          auditsWithoutPlan: 0,
        },
        globalResults: {},
        byStatus: {},
        recent: [],
      };

    const [
      byStatus,
      analysisGroups,
      recent,
      measures,
      noise,
      withoutData,
      withoutPlan,
    ] = await Promise.all([
      client.loraAudit.groupBy({ by: ["status"], _count: { _all: true } }),
      client.loraAnalysis.groupBy({
        by: ["auditId", "status"],
        _count: { _all: true },
      }),
      client.loraAudit.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        select: {
          id: true,
          name: true,
          code: true,
          client: true,
          status: true,
          floorPlanId: true,
          createdAt: true,
        },
      }),
      client.loraAuditMeasure.count(),
      client.loraAuditNoise.count(),
      client.loraAudit.count({
        where: { measureLinks: { none: {} }, noiseLinks: { none: {} } },
      }),
      client.loraAudit.count({ where: { floorPlanId: null } }),
    ]);

    const byStatusMap: Record<string, number> = {};
    for (const row of byStatus as any[])
      byStatusMap[row.status] = row._count._all;

    const perAudit = new Map<string, Record<string, number>>();
    for (const row of analysisGroups as any[]) {
      const map = perAudit.get(row.auditId) ?? {
        PASS: 0,
        WARNING: 0,
        FAIL: 0,
        UNKNOWN: 0,
      };
      map[row.status] += row._count._all;
      perAudit.set(row.auditId, map);
    }

    const globalResults: Record<string, number> = {};
    const evaluations = { ...emptyEvaluations } as Record<string, number>;
    for (const m of perAudit.values()) {
      const meaningful = m.PASS + m.WARNING + m.FAIL;
      const result =
        meaningful === 0
          ? "SIN_DATOS_SUFICIENTES"
          : m.FAIL > 0
            ? "NO_CONFORME"
            : m.WARNING > 0
              ? "APROBADO_CON_OBSERVACIONES"
              : "APROBADO";
      globalResults[result] = (globalResults[result] ?? 0) + 1;
      for (const key of ["PASS", "WARNING", "FAIL", "UNKNOWN"] as const) {
        evaluations[key] += m[key];
        evaluations.total += m[key];
      }
    }

    return {
      totals: {
        audits: Object.values(byStatusMap).reduce<number>((a, b) => a + b, 0),
        evaluations,
        measures,
        noise,
        auditsWithoutData: withoutData,
        auditsWithoutPlan: withoutPlan,
      },
      globalResults,
      byStatus: byStatusMap,
      recent,
    };
  }
}
