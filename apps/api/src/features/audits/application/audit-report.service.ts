import { Injectable, NotFoundException } from "@nestjs/common";

import { DatabaseService } from "@core/database/database.service";
import {
  IssueSeverity,
  SEVERITY_ORDER,
} from "@features/audits/domain/entities/audit.types";
import { AuditsService } from "./audits.service";
import { AuditDataQualityService } from "./audit-data-quality.service";

export const REPORT_SECTIONS = [
  "resumen",
  "metodologia",
  "equipamiento",
  "cobertura",
  "radio",
  "conectividad",
  "rendimiento",
  "roaming",
  "descubrimiento",
  "incidencias",
  "conclusiones",
  "recomendaciones",
  "anexos",
] as const;

export type ReportSection = (typeof REPORT_SECTIONS)[number];

@Injectable()
export class AuditReportService {
  constructor(
    private readonly database: DatabaseService,
    private readonly auditsService: AuditsService,
    private readonly dataQualityService: AuditDataQualityService
  ) {}

  private get client() {
    return this.database.getClient();
  }

  /**
   * Construye el payload completo del informe a partir de los datos
   * almacenados. El documento es siempre reproducible: no se guardan
   * snapshots de contenido, solo la configuración de secciones.
   */
  async buildReportData(auditId: string, sections?: ReportSection[]) {
    const audit = await this.auditsService.getByIdOrThrow(auditId);
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");

    const wanted = new Set<ReportSection>(
      sections && sections.length > 0 ? sections : [...REPORT_SECTIONS]
    );
    const include = (section: ReportSection) => wanted.has(section);

    const [evaluations, issues, recommendations, conclusion, members, dashboard] =
      await Promise.all([
        client.auditEvaluation.findMany({
          where: { auditId },
          orderBy: [{ category: "asc" }, { metric: "asc" }],
        }),
        client.auditIssue.findMany({ where: { auditId } }),
        client.auditRecommendation.findMany({
          where: { auditId },
          orderBy: { sortOrder: "asc" },
        }),
        client.auditConclusion.findUnique({ where: { auditId } }),
        this.auditsService.getMembers(auditId),
        this.auditsService.getDashboard(auditId),
      ]);

    const floors = await client.auditFloor.findMany({
      where: { auditId },
      orderBy: { order: "asc" },
    });
    const floorNameById = new Map<number, string>(
      floors.map((floor: any) => [floor.id, floor.name])
    );

    const data: Record<string, any> = {
      header: {
        name: audit.name,
        code: audit.code,
        client: audit.client,
        project: audit.project,
        location: audit.location,
        address: audit.address,
        building: audit.building,
        technician: audit.technician,
        status: audit.status,
        objective: audit.objective,
        scope: audit.scope,
        methodology: audit.methodology,
        observations: audit.observations,
        auditDate: audit.auditDate,
        startDate: audit.startDate,
        endDate: audit.endDate,
        lastSyncAt: audit.lastSyncAt,
        profileName: audit.profile?.name ?? null,
        generatedAt: new Date(),
      },
      resumen: {
        kpis: {
          measures: members.measures.length,
          surveys: members.surveys.length,
          analyses: members.analyses.length,
          evaluationsTotal: dashboard.evaluations.total,
          pass: dashboard.evaluations.PASS,
          warning: dashboard.evaluations.WARNING,
          fail: dashboard.evaluations.FAIL,
          unknown: dashboard.evaluations.UNKNOWN,
          pctPass: dashboard.evaluations.pctPass,
          pctWarning: dashboard.evaluations.pctWarning,
          pctFail: dashboard.evaluations.pctFail,
          aps: dashboard.discovery.aps,
          ssids: dashboard.discovery.ssids,
          clients: dashboard.discovery.clients,
          floors: dashboard.discovery.floors,
          issues: issues.filter((issue: any) => issue.state !== "DESCARTADA").length,
        },
        globalResult: conclusion?.globalResult ?? null,
        checklistPct: dashboard.checklist.pct,
      },
      cobertura: [] as Array<Record<string, unknown>>,
      radio: null as Record<string, unknown> | null,
      conectividad: this.buildConnectivityMatrix(evaluations),
      rendimiento: this.buildPerformance(evaluations),
      roaming: this.buildRoaming(evaluations),
      descubrimiento: null as Record<string, unknown> | null,
      incidencias: [] as Array<Record<string, unknown>>,
      recomendaciones: [] as Array<{ category: string; items: unknown[] }>,
      conclusiones: conclusion ?? null,
      anexos: {
        audit: Array.isArray((audit as any).anexos) ? ((audit as any).anexos as unknown[]) : [],
        evaluations: evaluations.map((evaluation: any) => ({
          category: evaluation.category,
          metric: evaluation.metric,
          value: evaluation.value,
          unit: evaluation.unit,
          status: evaluation.status,
          message: evaluation.message,
          sourceType: evaluation.sourceType,
          sourceGuid: evaluation.sourceGuid,
          location: evaluation.locationLabel,
          runAt: evaluation.runAt,
        })),
        members: {
          measures: (members.measures as Array<{ measure: Record<string, unknown> }>).map((link) => link.measure),
          surveys: (
            members.surveys as Array<{ survey: Record<string, unknown> }>
          ).map((link) => ({ ...link.survey, image: undefined })),
          analyses: (members.analyses as Array<{ analysis: Record<string, unknown> }>).map(
            (link) => link.analysis
          ),
        },
      },
      dataQuality: await this.dataQualityService.check(auditId),
    };

    // ---- Cobertura por encuesta (incluye plano y puntos para el heatmap) ----
    if (include("cobertura")) {
      const surveyEvaluations = evaluations.filter((evaluation: any) => evaluation.category === "COBERTURA");
      for (const link of members.surveys as Array<{
        surveyId: number;
        floorId: number | null;
        survey: { id: number; idLinkLive: string; name: string | null; surveyName: string | null; image?: string; surveyPointCount: number };
      }>) {
        const rows = surveyEvaluations.filter((evaluation: any) => evaluation.sourceGuid === link.survey.idLinkLive);
        const [surveyRow] = await client.linkLiveSurvey.findMany({
          where: { id: link.surveyId },
          select: {
            image: true,
            floorPlanWidth: true,
            floorPlanHeight: true,
            points: {
              where: { metric: { in: ["signal", "snr"] } },
              select: { metric: true, x: true, y: true, value: true },
              orderBy: [{ metric: "asc" }, { pointIdx: "asc" }],
            },
          },
        });
        data.cobertura.push({
          surveyId: link.survey.id,
          guid: link.survey.idLinkLive,
          name: link.survey.name ?? link.survey.surveyName ?? `Survey ${link.survey.id}`,
          floorName: link.floorId !== null ? floorNameById.get(link.floorId) ?? null : null,
          hasFloorPlanImage: Boolean(link.survey.image),
          image: surveyRow?.image ?? null,
          floorPlanWidth: surveyRow?.floorPlanWidth ?? null,
          floorPlanHeight: surveyRow?.floorPlanHeight ?? null,
          points:
            surveyRow?.points.map((point: any) => ({
              metric: point.metric,
              x: point.x,
              y: point.y,
              value: point.value,
            })) ?? [],
          pointCount: link.survey.surveyPointCount,
          evaluations: rows.map((row: any) => ({
            metric: row.metric,
            value: row.value,
            unit: row.unit,
            status: row.status,
            threshold: row.threshold,
            message: row.message,
          })),
        });
      }
    }

    // ---- Radio / descubrimiento desde análisis ----
    if (include("radio") || include("descubrimiento")) {
      const analysisLinks = await client.auditAnalysis.findMany({
        where: { auditId },
        include: { analysis: { select: { id: true, idLinkLive: true, name: true, startTime: true } } },
      });

      if (include("radio")) {
        const channelRows: Array<Record<string, unknown>> = [];
        const ssidRows: Array<Record<string, unknown>> = [];
        const apRows: Array<Record<string, unknown>> = [];

        for (const link of analysisLinks) {
          const hosts = await client.linkLiveAnalysisHost.findMany({
            where: { analysisId: link.analysis.id },
          });
          for (const host of hosts) {
            if (host.hostType === "channel") {
              channelRows.push(this.pick(host as any, ["channel", "band", "signal", "snr", "counts"]));
            } else if (host.hostType === "ssid") {
              ssidRows.push(this.pick(host as any, ["ssid", "securityType", "band", "signal", "snr", "protocol", "counts"]));
            } else if (host.hostType === "ap") {
              apRows.push(this.pick(host as any, ["name", "mac", "channel", "band", "signal", "snr", "ssid", "securityType", "counts"]));
            }
          }
        }

        const security = await this.securitySummary(auditId);
        data.radio = {
          channels: channelRows.slice(0, 100),
          ssids: ssidRows.slice(0, 100),
          aps: apRows.slice(0, 200),
          security,
          interference: (evaluations as any[])
            .filter((evaluation) =>
              ["CHANNEL_UTILIZATION", "CO_CHANNEL_INTERFERENCE", "ADJACENT_CHANNEL_INTERFERENCE", "ROGUE_APS", "NON_WIFI_UTILIZATION"].includes(
                evaluation.metric
              ) && evaluation.status !== "UNKNOWN"
            )
            .map((row) => ({
              metric: row.metric,
              value: row.value,
              unit: row.unit,
              status: row.status,
              message: row.message,
              location: row.locationLabel,
            })),
        };
      }

      if (include("descubrimiento")) {
        const firstAnalysis = analysisLinks[0]?.analysis ?? null;
        data.descubrimiento = {
          analysisCount: analysisLinks.length,
          primaryAnalysis: firstAnalysis
            ? {
                id: firstAnalysis.id,
                guid: firstAnalysis.idLinkLive,
                name: firstAnalysis.name,
                startTime: firstAnalysis.startTime,
                aps: dashboard.discovery.aps,
                ssids: dashboard.discovery.ssids,
                clients: dashboard.discovery.clients,
              }
            : null,
          securitySummary: await this.securitySummary(auditId),
        };
      }
    }

    // ---- Incidencias y recomendaciones ----
    const activeIssues = (issues as any[]).filter((issue) => issue.state !== "DESCARTADA");
    data.incidencias = activeIssues
      .sort(
        (a: any, b: any) =>
          SEVERITY_ORDER[a.severity as IssueSeverity] - SEVERITY_ORDER[b.severity as IssueSeverity]
      )
      .map((issue: any) => ({
        id: issue.id,
        origin: issue.origin,
        state: issue.state,
        severity: issue.severity,
        type: issue.type,
        title: issue.title,
        description: issue.description,
        location: issue.locationLabel ?? (issue.floorId !== null ? floorNameById.get(issue.floorId) : null),
        metric: issue.metric,
        value: issue.value,
        unit: issue.unit,
        recommendation: issue.recommendationText,
        photo: issue.photo,
      }));

    data.recomendaciones = ["INMEDIATA", "OPTIMIZACION", "INFRAESTRUCTURA"].map((category) => ({
      category,
      items: (recommendations as any[])
        .filter((recommendation) => recommendation.category === category && recommendation.accepted !== false)
        .map((recommendation) => ({
          id: recommendation.id,
          text: recommendation.text,
          origin: recommendation.origin,
          basis: recommendation.basis,
        })),
    }));

    return data;
  }

  private pick(record: Record<string, unknown>, keys: string[]): Record<string, unknown> {
    const out: Record<string, unknown> = {};
    for (const key of keys) {
      out[key] = record[key] ?? null;
    }
    return out;
  }

  private buildConnectivityMatrix(evaluations: any[]) {
    const byPoint = new Map<string, Record<string, unknown>>();
    const metricsOrder = ["ASSOCIATION", "DHCP", "GATEWAY", "DNS", "INTERNET", "HTTP_HTTPS"];

    for (const evaluation of evaluations) {
      if (evaluation.category !== "CONECTIVIDAD") continue;
      const key = String(evaluation.sourceGuid ?? evaluation.locationLabel ?? "—");
      let row = byPoint.get(key);
      if (!row) {
        row = {
          point: evaluation.locationLabel ?? key,
          sourceGuid: evaluation.sourceGuid,
          results: {} as Record<string, { status: string; message: string }>,
        };
        byPoint.set(key, row);
      }
      (row.results as Record<string, unknown>)[String(evaluation.metric)] = {
        status: evaluation.status,
        message: evaluation.message,
      };
    }

    return {
      metricsOrder,
      rows: [...byPoint.values()],
    };
  }

  private buildPerformance(evaluations: any[]) {
    const rows = evaluations.filter((evaluation) => evaluation.category === "RENDIMIENTO");
    const performed = rows.some((row) => row.status !== "UNKNOWN");
    return {
      performed,
      note: performed
        ? null
        : "Prueba de rendimiento no realizada o no disponible en los datos capturados.",
      evaluations: rows.map((row) => ({
        metric: row.metric,
        value: row.value,
        unit: row.unit,
        status: row.status,
        message: row.message,
        location: row.locationLabel,
        sourceGuid: row.sourceGuid,
      })),
    };
  }

  private buildRoaming(evaluations: any[]) {
    const row = evaluations.find((evaluation) => evaluation.metric === "ROAMING");
    return {
      performed: Boolean(row && row.status !== "UNKNOWN"),
      note:
        row && row.status === "UNKNOWN"
          ? "Prueba de roaming no realizada o datos no disponibles."
          : null,
      evaluation: row ?? null,
    };
  }

  private async securitySummary(auditId: string): Promise<Array<{ type: string; count: number }>> {
    const client = this.client;
    if (!client) return [];
    const grouped = await client.linkLiveAnalysisHost.groupBy({
      by: ["securityType"],
      where: {
        hostType: { in: ["ap", "bssid"] },
        analysis: { auditLinks: { some: { auditId } } },
      },
      _count: { _all: true },
    });
    return grouped.map((row: any) => ({
      type: row.securityType ?? "Sin clasificar",
      count: row._count._all,
    }));
  }

  // ---- Versiones ----

  async saveVersion(auditId: string, config: { sections: ReportSection[] }) {
    const audit = await this.auditsService.getByIdOrThrow(auditId);
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");

    const last = await client.auditReport.findFirst({
      where: { auditId },
      orderBy: { version: "desc" },
    });
    const version = (last?.version ?? 0) + 1;
    const report = await client.auditReport.create({
      data: { auditId, version, config: config as unknown as object },
    });

    // Generar informe marca el estado si la auditoría está completada.
    if (["COMPLETADA", "PENDIENTE_DE_REVISION"].includes(audit.status)) {
      await client.audit.update({ where: { id: auditId }, data: { status: "INFORME_GENERADO" } });
    }
    return report;
  }

  async listVersions(auditId: string) {
    const client = this.client;
    if (!client) return [];
    return client.auditReport.findMany({
      where: { auditId },
      orderBy: { version: "desc" },
    });
  }

  async getConclusion(auditId: string) {
    await this.auditsService.getByIdOrThrow(auditId);
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    return client.auditConclusion.findUnique({ where: { auditId } });
  }

  async updateConclusion(
    auditId: string,
    input: Partial<{ finalText: string; globalResult: string }>
  ) {
    await this.auditsService.getByIdOrThrow(auditId);
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    const existing = await client.auditConclusion.findUnique({ where: { auditId } });
    if (!existing) throw new NotFoundException("Conclusión no generada todavía");

    return client.auditConclusion.update({
      where: { auditId },
      data: {
        ...(input.finalText !== undefined ? { finalText: input.finalText, editedAt: new Date() } : {}),
        ...(input.globalResult !== undefined ? { globalResult: input.globalResult } : {}),
      },
    });
  }
}
