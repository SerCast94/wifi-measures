import { Injectable, Logger, NotFoundException } from "@nestjs/common";

import { DatabaseService } from "@core/database/database.service";
import {
  AUDIT_STATUSES,
  AuditStatus,
  SECTION_LABELS,
} from "@features/audits/domain/entities/audit.types";
import { CHECKLIST_TEMPLATE } from "@features/audits/domain/entities/checklist-template";
import { AUDIT_TEST_SECTIONS } from "@features/audits/domain/entities/audit.types";
import { PROFILE_PRESETS } from "@features/audits/domain/entities/profile-presets";
import { classifyMeasureType } from "@features/measures/domain/entities/measure-type";

export interface CreateAuditInput {
  name: string;
  code?: string;
  client?: string;
  project?: string;
  location?: string;
  address?: string;
  building?: string;
  technician?: string;
  description?: string;
  objective?: string;
  scope?: string;
  methodology?: string;
  observations?: string;
  auditDate?: Date | null;
  startDate?: Date | null;
  endDate?: Date | null;
  profileId?: string | null;
  areaKeys?: string[];
  ssidFilter?: string | null;
  floorNames?: string[];
}

export type UpdateAuditInput = Partial<CreateAuditInput>;

@Injectable()
export class AuditsService {
  private readonly logger = new Logger(AuditsService.name);

  constructor(private readonly database: DatabaseService) {}

  private get client() {
    return this.database.getClient();
  }

  /** Crea (idempotente) los perfiles preset semilla. */
  async ensureProfiles() {
    const client = this.client;
    if (!client) return;

    for (const preset of PROFILE_PRESETS) {
      await client.auditProfile.upsert({
        where: { name: preset.name },
        create: {
          name: preset.name,
          auditType: preset.auditType,
          description: preset.description,
          thresholds: preset.thresholds as unknown as object,
          isDefault: Boolean(preset.isDefault),
        },
        update: {},
      });
    }
  }

  async listProfiles() {
    const client = this.client;
    if (!client) return [];
    await this.ensureProfiles();
    return client.auditProfile.findMany({
      orderBy: [{ isDefault: "desc" }, { name: "asc" }],
    });
  }

  /** Reemplaza los anexos (adjuntos Link-Live) de la auditoría. */
  async setAnexos(
    auditId: string,
    items: Array<{ name: string; href: string }>
  ) {
    await this.getByIdOrThrow(auditId);
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    const clean = Array.isArray(items)
      ? items
          .filter(
            (item) =>
              item &&
              typeof item.name === "string" &&
              typeof item.href === "string"
          )
          .map((item) => ({
            name: item.name,
            href: item.href,
            thumb: (item as { thumb?: string }).thumb,
          }))
      : [];
    return client.audit.update({
      where: { id: auditId },
      data: { anexos: clean },
    });
  }

  /** Actualiza un perfil (nombre, descripción, extras de checklist). */
  async updateProfile(
    profileId: string,
    input: { name?: string; description?: string; checklistExtras?: unknown }
  ) {
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");

    const data: Record<string, unknown> = {};
    if (input.name !== undefined) data.name = input.name;
    if (input.description !== undefined) data.description = input.description;
    if (input.checklistExtras !== undefined) {
      const extras = input.checklistExtras as any;
      if (!Array.isArray(extras)) {
        throw new Error("checklistExtras debe ser un array");
      }
      data.checklistExtras = extras;
    }
    if (Object.keys(data).length === 0) return null;

    return client.auditProfile.update({ where: { id: profileId }, data });
  }

  async list(params: {
    page?: number;
    size?: number;
    q?: string;
    status?: string;
  }) {
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
    if (
      params.status &&
      (AUDIT_STATUSES as readonly string[]).includes(params.status)
    ) {
      where.status = params.status;
    }

    const [total, items] = await Promise.all([
      client.audit.count({ where }),
      client.audit.findMany({
        where,
        include: {
          profile: true,
          _count: {
            select: {
              measures: true,
              surveys: true,
              analyses: true,
              issues: true,
            },
          },
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * size,
        take: size,
      }),
    ]);

    return { items, total, page, size };
  }

  async getById(id: string) {
    const client = this.client;
    if (!client) return null;
    return client.audit.findUnique({
      where: { id },
      include: {
        profile: true,
        floors: { orderBy: { order: "asc" } },
        conclusion: true,
        reports: { orderBy: { version: "desc" }, take: 5 },
        syncLogs: { orderBy: { startedAt: "desc" }, take: 1 },
        _count: {
          select: {
            measures: true,
            surveys: true,
            analyses: true,
            issues: true,
            recommendations: true,
            evaluations: true,
          },
        },
      },
    });
  }

  async getByIdOrThrow(id: string) {
    const audit = await this.getById(id);
    if (!audit) throw new NotFoundException("Auditoría no encontrada");
    return audit;
  }

  async create(input: CreateAuditInput) {
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    await this.ensureProfiles();

    let profileId = input.profileId ?? null;
    if (!profileId) {
      const def = await client.auditProfile.findFirst({
        where: { isDefault: true },
      });
      profileId = def?.id ?? null;
    }

    const created = await client.audit.create({
      data: {
        name: input.name,
        code: input.code ?? null,
        client: input.client ?? null,
        project: input.project ?? null,
        location: input.location ?? null,
        address: input.address ?? null,
        building: input.building ?? null,
        technician: input.technician ?? null,
        description: input.description ?? null,
        objective: input.objective ?? null,
        scope: input.scope ?? null,
        methodology: input.methodology ?? null,
        observations: input.observations ?? null,
        auditDate: input.auditDate ?? new Date(),
        startDate: input.startDate ?? null,
        endDate: input.endDate ?? null,
        profileId,
        areaKeys: input.areaKeys ?? [],
        ssidFilter: input.ssidFilter ?? null,
        floors: {
          create: (input.floorNames ?? []).map((name, index) => ({
            name,
            order: index,
          })),
        },
      },
    });

    await this.seedChecklist(created.id);
    return this.getByIdOrThrow(created.id);
  }

  /** Instancia el checklist desde la plantilla (ítems no existentes). */
  async seedChecklist(auditId: string) {
    const client = this.client;
    if (!client) return;

    const auditRow = await client.audit.findUnique({
      where: { id: auditId },
      select: {
        profile: { select: { checklistExtras: true } },
      },
    });

    const extrasRaw = (auditRow?.profile as any)?.checklistExtras as
      | Array<{
          section?: string;
          key?: string;
          title: string;
          required?: boolean;
        }>
      | null
      | undefined;
    const validSections = new Set<string>(AUDIT_TEST_SECTIONS);
    const extras = Array.isArray(extrasRaw)
      ? extrasRaw.filter(
          (item) =>
            item &&
            typeof item.title === "string" &&
            validSections.has(String(item.section))
        )
      : [];

    let sortOrder = 0;
    for (const section of CHECKLIST_TEMPLATE) {
      for (const item of section.items) {
        sortOrder += 1;
        await client.auditTest.upsert({
          where: { auditId_key: { auditId, key: item.key } },
          create: {
            auditId,
            section: section.section,
            key: item.key,
            title: item.title,
            required: item.required,
            sourceType: item.sourceType ?? "MANUAL",
            sortOrder,
          },
          update: {},
        });
      }
    }

    for (const [index, item] of extras.entries()) {
      sortOrder += 1;
      const key = item.key?.trim() || `custom.${sortOrder}.${index}`;
      await client.auditTest.upsert({
        where: { auditId_key: { auditId, key } },
        create: {
          auditId,
          section: String(item.section),
          key,
          title: String(item.title),
          required: Boolean(item.required ?? false),
          sourceType: "MANUAL",
          sortOrder,
        },
        update: {
          title: String(item.title),
          required: Boolean(item.required ?? false),
          sortOrder,
        },
      });
    }
  }

  async update(id: string, input: UpdateAuditInput) {
    await this.getByIdOrThrow(id);
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");

    const { floorNames, ...rest } = input;
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(rest)) {
      if (value !== undefined) data[key] = value;
    }

    await client.$transaction(async (tx: any) => {
      if (Object.keys(data).length > 0) {
        await tx.audit.update({ where: { id }, data });
      }
      if (floorNames) {
        await tx.auditFloor.deleteMany({ where: { auditId: id } });
        if (floorNames.length > 0) {
          await tx.auditFloor.createMany({
            data: floorNames.map((name, index) => ({
              auditId: id,
              name,
              order: index,
            })),
          });
        }
      }
    });

    return this.getByIdOrThrow(id);
  }

  async updateStatus(id: string, status: AuditStatus) {
    await this.getByIdOrThrow(id);
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    return client.audit.update({ where: { id }, data: { status } });
  }

  async remove(id: string) {
    await this.getByIdOrThrow(id);
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    await client.audit.delete({ where: { id } });
    return { ok: true };
  }

  // ---------- Miembros ----------

  async addMeasures(auditId: string, measureIds: string[]) {
    await this.getByIdOrThrow(auditId);
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    for (const measureId of measureIds) {
      await client.auditMeasure.upsert({
        where: { auditId_measureId: { auditId, measureId } },
        create: { auditId, measureId },
        update: {},
      });
    }
    return this.getMembers(auditId);
  }

  async removeMeasure(auditId: string, measureId: string) {
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    await client.auditMeasure.deleteMany({
      where: { auditId, measureId },
    });
    return this.getMembers(auditId);
  }

  async setMeasureFloor(
    auditId: string,
    measureId: string,
    floorId: number | null,
    label?: string
  ) {
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    return client.auditMeasure.update({
      where: { auditId_measureId: { auditId, measureId } },
      data: { floorId, ...(label !== undefined ? { label } : {}) },
    });
  }

  async addSurveys(
    auditId: string,
    surveyIds: number[],
    floorId?: number | null
  ) {
    await this.getByIdOrThrow(auditId);
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    for (const surveyId of surveyIds) {
      await client.auditSurvey.upsert({
        where: { auditId_surveyId: { auditId, surveyId } },
        create: { auditId, surveyId, floorId: floorId ?? null },
        update: floorId === undefined ? {} : { floorId },
      });
    }
    return this.getMembers(auditId);
  }

  async removeSurvey(auditId: string, surveyId: number) {
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    await client.auditSurvey.deleteMany({ where: { auditId, surveyId } });
    return this.getMembers(auditId);
  }

  async addAnalyses(auditId: string, analysisIds: number[]) {
    await this.getByIdOrThrow(auditId);
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    for (const analysisId of analysisIds) {
      await client.auditAnalysis.upsert({
        where: { auditId_analysisId: { auditId, analysisId } },
        create: { auditId, analysisId },
        update: {},
      });
    }
    return this.getMembers(auditId);
  }

  async removeAnalysis(auditId: string, analysisId: number) {
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    await client.auditAnalysis.deleteMany({ where: { auditId, analysisId } });
    return this.getMembers(auditId);
  }

  async getMembers(auditId: string) {
    await this.getByIdOrThrow(auditId);
    const client = this.client;
    if (!client) return { measures: [], surveys: [], analyses: [] };
    const [measures, surveys, analyses] = await Promise.all([
      client.auditMeasure.findMany({
        where: { auditId },
        include: {
          measure: {
            select: {
              id: true,
              idLinkLive: true,
              name: true,
              fechaHora: true,
              createdAt: true,
              overallColor: true,
              resultType: true,
              unitName: true,
              unitMac: true,
              profileName: true,
            },
          },
        },
        orderBy: { measure: { createdAt: "desc" } },
      }),
      client.auditSurvey.findMany({
        where: { auditId },
        include: {
          survey: {
            select: {
              id: true,
              idLinkLive: true,
              name: true,
              surveyName: true,
              surveyPointCount: true,
              image: true,
              surveyStartTime: true,
            },
          },
        },
      }),
      client.auditAnalysis.findMany({
        where: { auditId },
        include: {
          analysis: {
            select: {
              id: true,
              idLinkLive: true,
              guid: true,
              analysisGuid: true,
              name: true,
              startTime: true,
              apsCount: true,
              ssidsCount: true,
              clientsCount: true,
            },
          },
        },
      }),
    ]);
    // la imagen del plano es pesada: se devuelve solo presencia
    return {
      measures: measures.map((m: any) => ({
        ...m,
        measureType: classifyMeasureType(m.measure?.resultType),
      })),
      surveys: surveys.map((s: any) => ({
        ...s,
        survey: {
          ...s.survey,
          hasImage: Boolean(s.survey.image),
          image: undefined,
        },
      })),
      analyses,
    };
  }

  /**
   * Candidatos para vincular a la auditoría: resultados aún no miembros que
   * encajan con los filtros de captura (rango de fechas y claves de área).
   * Paginado server-side (page/size) para históricos grandes.
   */
  async getCandidates(
    auditId: string,
    paging?: { page?: number; size?: number }
  ) {
    const audit = await this.getByIdOrThrow(auditId);
    const client = this.client;
    if (!client)
      return {
        measures: [],
        surveys: [],
        analyses: [],
        total: 0,
        page: 1,
        size: 50,
      };

    const page = Math.max(1, paging?.page ?? 1);
    const size = Math.min(200, Math.max(10, paging?.size ?? 50));

    const [membersM, membersS, membersA] = await Promise.all([
      client.auditMeasure.findMany({
        where: { auditId },
        select: { measureId: true },
      }),
      client.auditSurvey.findMany({
        where: { auditId },
        select: { surveyId: true },
      }),
      client.auditAnalysis.findMany({
        where: { auditId },
        select: { analysisId: true },
      }),
    ]);
    const excludeM = membersM.map((m: any) => m.measureId);
    const excludeS = membersS.map((m: any) => m.surveyId);
    const excludeA = membersA.map((m: any) => m.analysisId);

    const dateFilter: Record<string, Date> = {};
    if (audit.startDate) dateFilter.gte = audit.startDate;
    if (audit.endDate) {
      const end = new Date(audit.endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }
    // El rango de la auditoría se compara con el momento de la CAPTURA
    // (no con la fecha de sincronización en BD).
    const hasDateWindow = Boolean(audit.startDate || audit.endDate);

    const measureWhere: Record<string, unknown> = {
      id: {
        notIn:
          excludeM.length > 0
            ? excludeM
            : ["00000000-0000-0000-0000-000000000000"],
      },
    };
    if (hasDateWindow) measureWhere.fechaHora = dateFilter;
    if (audit.areaKeys.length > 0 || audit.ssidFilter) {
      const keyFilter = [...audit.areaKeys];
      measureWhere.OR = [
        ...(keyFilter.length > 0 ? [{ unitName: { in: keyFilter } }] : []),
        ...(keyFilter.length > 0 ? [{ labels: { hasSome: keyFilter } }] : []),
        ...(audit.ssidFilter
          ? [{ raw: { path: ["ssid"], string_contains: audit.ssidFilter } }]
          : []),
      ];
    }

    const [
      measures,
      surveys,
      analyses,
      totalMeasures,
      totalSurveys,
      totalAnalyses,
    ] = await Promise.all([
      client.medida.findMany({
        where: measureWhere,
        select: {
          id: true,
          idLinkLive: true,
          name: true,
          resultType: true,
          createdAt: true,
          overallColor: true,
          unitName: true,
        },
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * size,
        take: size,
      }),
      client.linkLiveSurvey.findMany({
        where: {
          id: { notIn: excludeS },
          ...(hasDateWindow ? { surveyStartTime: dateFilter } : {}),
        },
        select: {
          id: true,
          idLinkLive: true,
          name: true,
          surveyName: true,
          surveyPointCount: true,
          surveyStartTime: true,
        },
        orderBy: { surveyStartTime: "desc" },
        skip: (page - 1) * size,
        take: size,
      }),
      client.linkLiveAnalysis.findMany({
        where: {
          id: { notIn: excludeA },
          ...(hasDateWindow ? { startTime: dateFilter } : {}),
        },
        select: {
          id: true,
          idLinkLive: true,
          name: true,
          startTime: true,
          apsCount: true,
          ssidsCount: true,
          clientsCount: true,
        },
        orderBy: { startTime: "desc" },
        skip: (page - 1) * size,
        take: size,
      }),
      client.medida.count({ where: measureWhere }),
      client.linkLiveSurvey.count({
        where: {
          id: { notIn: excludeS },
          ...(hasDateWindow ? { surveyStartTime: dateFilter } : {}),
        },
      }),
      client.linkLiveAnalysis.count({
        where: {
          id: { notIn: excludeA },
          ...(hasDateWindow ? { startTime: dateFilter } : {}),
        },
      }),
    ]);

    return {
      measures: measures.map((m: any) => ({
        ...m,
        measureType: classifyMeasureType(m.resultType),
      })),
      surveys,
      analyses,
      paging: {
        page,
        size,
        totals: {
          measure: totalMeasures,
          survey: totalSurveys,
          analysis: totalAnalyses,
        },
      },
    };
  }

  /**
   * Actualiza metadatos de un miembro vinculado (planta asignada, etiqueta).
   */
  async updateMember(
    auditId: string,
    type: "measure" | "survey" | "analysis",
    memberId: string,
    input: { floorId?: number | null; label?: string }
  ) {
    await this.getByIdOrThrow(auditId);
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");

    const data: Record<string, unknown> = {};
    if (input.floorId !== undefined) data.floorId = input.floorId;
    if (input.label !== undefined) data.label = input.label;
    if (Object.keys(data).length === 0) return null;

    if (type === "measure") {
      return client.auditMeasure.update({
        where: { auditId_measureId: { auditId, measureId: memberId } },
        data,
      });
    }
    if (type === "survey") {
      return client.auditSurvey.update({
        where: { auditId_surveyId: { auditId, surveyId: Number(memberId) } },
        data,
      });
    }
    return client.auditAnalysis.update({
      where: { auditId_analysisId: { auditId, analysisId: Number(memberId) } },
      data,
    });
  }

  /** Métricas globales para el dashboard de inicio. */
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
        totals: { audits: 0, evaluations: emptyEvaluations, openIssues: 0 },
        byStatus: {},
        recent: [],
      };

    const [byStatus, evalGroup, openIssues, recent, syncErrors] =
      await Promise.all([
        client.audit.groupBy({ by: ["status"], _count: { _all: true } }),
        client.auditEvaluation.groupBy({
          by: ["status"],
          _count: { _all: true },
        }),
        client.auditIssue.count({
          where: { state: { in: ["SUGERIDA", "ACEPTADA", "MODIFICADA"] } },
        }),
        client.audit.findMany({
          orderBy: { createdAt: "desc" },
          take: 5,
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
            client: true,
            createdAt: true,
          },
        }),
        client.auditSyncLog.count({
          where: {
            ok: false,
            startedAt: { gte: new Date(Date.now() - 7 * 864e5) },
          },
        }),
      ]);

    const byStatusMap: Record<string, number> = {};
    for (const row of byStatus as any[])
      byStatusMap[row.status] = row._count._all;

    const evaluations = { ...emptyEvaluations } as Record<string, number>;
    for (const row of evalGroup as any[]) {
      evaluations[row.status] = row._count._all;
      evaluations.total += row._count._all;
    }

    return {
      totals: {
        audits: Object.values(byStatusMap).reduce<number>((a, b) => a + b, 0),
        evaluations,
        openIssues,
        syncErrors,
      },
      byStatus: byStatusMap,
      recent,
    };
  }

  /** Comparativa de resultados entre auditorías recientes. */
  async getComparison() {
    const client = this.client;
    if (!client) return { audits: [] };

    const audits = await client.audit.findMany({
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        name: true,
        code: true,
        client: true,
        status: true,
        createdAt: true,
        conclusion: { select: { globalResult: true } },
      },
    });
    if (audits.length === 0) return { audits: [] };

    const groups = await client.auditEvaluation.groupBy({
      by: ["auditId", "status"],
      where: { auditId: { in: audits.map((audit: any) => audit.id) } },
      _count: { _all: true },
    });

    const byAudit = new Map<string, Record<string, number>>();
    for (const group of groups as any[]) {
      const row =
        byAudit.get(group.auditId) ??
        ({ PASS: 0, WARNING: 0, FAIL: 0, UNKNOWN: 0, total: 0 } as Record<
          string,
          number
        >);
      row[group.status] = group._count._all;
      row.total += group._count._all;
      byAudit.set(group.auditId, row);
    }

    return {
      audits: audits.map((audit: any) => ({
        ...audit,
        evaluations: byAudit.get(audit.id) ?? {
          PASS: 0,
          WARNING: 0,
          FAIL: 0,
          UNKNOWN: 0,
          total: 0,
        },
      })),
    };
  }

  // ---------- Checklist ----------

  async updateTest(
    auditId: string,
    testId: string,
    input: { status?: string; notes?: string; resultStatus?: string | null }
  ) {
    await this.getByIdOrThrow(auditId);
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");

    const test = await client.auditTest.findFirst({
      where: { id: testId, auditId },
    });
    if (!test) throw new NotFoundException("Prueba no encontrada");

    const data: Record<string, unknown> = {};
    if (
      input.status &&
      ["PENDIENTE", "COMPLETADA", "NO_APLICABLE"].includes(input.status)
    ) {
      data.status = input.status;
      data.completedAt = input.status === "COMPLETADA" ? new Date() : null;
    }
    if (input.notes !== undefined) data.notes = input.notes;
    if (input.resultStatus !== undefined)
      data.resultStatus = input.resultStatus;

    return client.auditTest.update({ where: { id: testId }, data });
  }

  async addManualTest(
    auditId: string,
    input: { title: string; section: string }
  ) {
    await this.getByIdOrThrow(auditId);
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    const maxOrder = await client.auditTest.aggregate({
      where: { auditId },
      _max: { sortOrder: true },
    });
    return client.auditTest.create({
      data: {
        auditId,
        section: input.section,
        key: `manual.${Date.now()}.${Math.random().toString(36).slice(2, 8)}`,
        title: input.title,
        required: false,
        sourceType: "MANUAL",
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });
  }

  async deleteTest(auditId: string, testId: string) {
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    const test = await client.auditTest.findFirst({
      where: { id: testId, auditId },
    });
    if (!test) throw new NotFoundException("Prueba no encontrada");
    await client.auditTest.delete({ where: { id: testId } });
    return { ok: true };
  }

  // ---------- Dashboard ----------

  async getChecklistProgress(auditId: string) {
    const client = this.client;
    if (!client) {
      return {
        total: 0,
        required: 0,
        completed: 0,
        pendingRequired: 0,
        pct: 0,
        sections: [],
      };
    }
    const tests = await client.auditTest.findMany({ where: { auditId } });

    const required = tests.filter((t: any) => t.required);
    // «No aplica» resuelve el ítem: resta del denominador del progreso.
    const applicable = required.filter((t: any) => t.status !== "NO_APLICABLE");
    const completed = required.filter(
      (t: any) => t.status === "COMPLETADA"
    ).length;

    const sections = Object.entries(SECTION_LABELS).map(([section, label]) => {
      const sectionTests = tests.filter((t: any) => t.section === section);
      const req = sectionTests.filter((t: any) => t.required);
      const reqApplicable = req.filter((t: any) => t.status !== "NO_APLICABLE");
      const done = req.filter((t: any) => t.status === "COMPLETADA").length;
      const na = sectionTests.filter(
        (t: any) => t.status === "NO_APLICABLE"
      ).length;
      const evaluated = sectionTests.filter(
        (t: any) => t.resultStatus === "FAIL"
      ).length;
      return {
        section,
        label,
        total: sectionTests.length,
        required: req.length,
        completed: done,
        notApplicable: na,
        failing: evaluated,
        pct:
          reqApplicable.length > 0
            ? Math.round((done / reqApplicable.length) * 100)
            : null,
      };
    });

    return {
      total: tests.length,
      required: required.length,
      completed,
      pendingRequired: applicable.filter((t: any) => t.status === "PENDIENTE")
        .length,
      pct:
        applicable.length > 0
          ? Math.round((completed / applicable.length) * 100)
          : 0,
      sections,
    };
  }

  /** Resumen agregado del dashboard de auditoría. */
  async getDashboard(auditId: string): Promise<{
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
        pct: number | null;
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
      lastRunAt: Date | null;
    };
    issues: {
      bySeverity: Record<string, number>;
      suggested: number;
      accepted: number;
      active: number;
    };
    conclusion: { globalResult: string | null };
    discovery: { aps: number; ssids: number; clients: number; floors: number };
  }> {
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");

    const [
      checklist,
      evalCounts,
      issueCounts,
      hostCounts,
      lastEvaluationRun,
      conclusionRow,
    ] = await Promise.all([
      this.getChecklistProgress(auditId),
      client.auditEvaluation.groupBy({
        by: ["status"],
        where: { auditId },
        _count: { _all: true },
      }),
      client.auditIssue.groupBy({
        by: ["severity", "state"],
        where: { auditId },
        _count: { _all: true },
      }),
      Promise.all([
        client.auditAnalysis.findMany({
          where: { auditId },
          select: {
            analysis: {
              select: { apsCount: true, ssidsCount: true, clientsCount: true },
            },
          },
        }),
        client.auditFloor.count({ where: { auditId } }),
      ]),
      client.auditEvaluation.findFirst({
        where: { auditId },
        orderBy: { runAt: "desc" },
        select: { runAt: true },
      }),
      client.auditConclusion.findUnique({
        where: { auditId },
        select: { globalResult: true },
      }),
    ]);

    const evaluations = {
      PASS: 0,
      WARNING: 0,
      FAIL: 0,
      UNKNOWN: 0,
    } as Record<string, number>;
    for (const row of evalCounts) {
      evaluations[row.status] = row._count._all;
    }
    const totalEvaluations = Object.values(evaluations).reduce(
      (a, b) => a + b,
      0
    );

    const issuesBySeverity: Record<string, number> = {
      INFO: 0,
      LOW: 0,
      MEDIUM: 0,
      HIGH: 0,
      CRITICAL: 0,
    };
    let suggestedIssues = 0;
    let acceptedIssues = 0;
    let activeIssues = 0;
    for (const row of issueCounts) {
      if (row.severity in issuesBySeverity) {
        issuesBySeverity[row.severity] += row._count._all;
      }
      if (row.state === "SUGERIDA") suggestedIssues += row._count._all;
      if (row.state === "ACEPTADA" || row.state === "MODIFICADA")
        acceptedIssues += row._count._all;
      if (row.state !== "DESCARTADA") activeIssues += row._count._all;
    }

    const hosts = hostCounts[0].reduce(
      (acc: any, link: any) => ({
        aps: acc.aps + (link.analysis.apsCount ?? 0),
        ssids: acc.ssids + (link.analysis.ssidsCount ?? 0),
        clients: acc.clients + (link.analysis.clientsCount ?? 0),
      }),
      { aps: 0, ssids: 0, clients: 0 }
    );

    const pctPass =
      totalEvaluations > 0
        ? Math.round((evaluations.PASS / totalEvaluations) * 100)
        : 0;
    const pctWarning =
      totalEvaluations > 0
        ? Math.round((evaluations.WARNING / totalEvaluations) * 100)
        : 0;
    const pctFail =
      totalEvaluations > 0
        ? Math.round((evaluations.FAIL / totalEvaluations) * 100)
        : 0;

    return {
      checklist,
      evaluations: {
        PASS: evaluations.PASS,
        WARNING: evaluations.WARNING,
        FAIL: evaluations.FAIL,
        UNKNOWN: evaluations.UNKNOWN,
        total: totalEvaluations,
        pctPass,
        pctWarning,
        pctFail,
        lastRunAt: lastEvaluationRun?.runAt ?? null,
      },
      issues: {
        bySeverity: issuesBySeverity,
        suggested: suggestedIssues,
        accepted: acceptedIssues,
        active: activeIssues,
      },
      conclusion: {
        globalResult: conclusionRow?.globalResult ?? null,
      },
      discovery: {
        aps: hosts.aps,
        ssids: hosts.ssids,
        clients: hosts.clients,
        floors: hostCounts[1],
      },
    };
  }
}
