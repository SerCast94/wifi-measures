import { Injectable, NotFoundException } from "@nestjs/common";

import { DatabaseService } from "@core/database/database.service";

export interface LoraMeasureBlockInput {
  role?: string | null;
  totalPackets?: number | null;
  successfulPackets?: number | null;
  rssi?: number | null;
  snr?: number | null;
  packetLossPct?: number | null;
  longitude?: number | null;
  latitude?: number | null;
  location?: string | null;
}

export interface CreateLoraMeasureInput {
  location?: string | null;
  time?: string | null;
  spreadingFactor?: string | null;
  txPower?: string | null;
  blocks?: LoraMeasureBlockInput[];
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
  measureId?: number | null;
  noiseId?: number | null;
  floorPlanId?: number | null;
}

export type UpdateLoraAuditInput = Partial<CreateLoraAuditInput>;

@Injectable()
export class LoraService {
  constructor(private readonly database: DatabaseService) {}

  private get client() {
    return this.database.getClient();
  }

  // ---------- Medidas ----------

  async createMeasures(inputs: CreateLoraMeasureInput[]) {
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    const rows = Array.isArray(inputs) ? inputs : [];
    for (const input of rows) {
      await client.loraMeasure.create({
        data: {
          location: input.location ?? null,
          time: input.time ?? null,
          spreadingFactor: input.spreadingFactor ?? null,
          txPower: input.txPower ?? null,
          blocks: Array.isArray(input.blocks) ? input.blocks : [],
        },
      });
    }
    return this.listMeasures();
  }

  async listMeasures() {
    const client = this.client;
    if (!client) return [];
    return client.loraMeasure.findMany({ orderBy: { createdAt: "desc" } });
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

  // ---------- Ruido ----------

  async createNoise(inputs: CreateLoraNoiseInput[]) {
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    const rows = Array.isArray(inputs) ? inputs : [];
    for (const input of rows) {
      await client.loraNoise.create({
        data: {
          location: input.location ?? null,
          longitude: input.longitude ?? null,
          latitude: input.latitude ?? null,
          entries: Array.isArray(input.entries) ? input.entries : [],
        },
      });
    }
    return this.listNoise();
  }

  async listNoise() {
    const client = this.client;
    if (!client) return [];
    return client.loraNoise.findMany({ orderBy: { createdAt: "desc" } });
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
        include: { measure: true, noise: true },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * size,
        take: size,
      }),
    ]);

    return { items, total, page, size };
  }

  async getAuditById(id: string) {
    const client = this.client;
    if (!client) return null;
    return client.loraAudit.findUnique({
      where: { id },
      include: { measure: true, noise: true },
    });
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
        measureId: input.measureId ?? null,
        noiseId: input.noiseId ?? null,
        floorPlanId: input.floorPlanId ?? null,
      },
    });
    return this.getAuditByIdOrThrow(created.id);
  }

  async updateAudit(id: string, input: UpdateLoraAuditInput) {
    await this.getAuditByIdOrThrow(id);
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");

    const data: Record<string, unknown> = {};
    for (const key of Object.keys(input) as Array<keyof CreateLoraAuditInput>) {
      if (input[key] !== undefined) data[key] = input[key];
    }
    if (Object.keys(data).length > 0) {
      await client.loraAudit.update({ where: { id }, data });
    }
    return this.getAuditByIdOrThrow(id);
  }

  async updateAuditStatus(id: string, status: string) {
    await this.getAuditByIdOrThrow(id);
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    return client.loraAudit.update({ where: { id }, data: { status } });
  }

  async removeAudit(id: string) {
    await this.getAuditByIdOrThrow(id);
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    await client.loraAudit.delete({ where: { id } });
    return { ok: true };
  }
}
