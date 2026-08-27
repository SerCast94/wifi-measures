import { Injectable } from "@nestjs/common";

import { DatabaseService } from "@core/database/database.service";
import { parseNum } from "./evaluation-lib";

export interface QualityProblem {
  severity: "ERROR" | "WARNING" | "INFO";
  code: string;
  message: string;
  refs: string[];
}

/**
 * Control de calidad de datos de la auditoría. Detecta huecos reales en los
 * datos almacenados para que el técnico pueda corregirlos antes del informe.
 */
@Injectable()
export class AuditDataQualityService {
  constructor(private readonly database: DatabaseService) {}

  private get client() {
    return this.database.getClient();
  }

  async check(auditId: string): Promise<{
    complete: boolean;
    problems: QualityProblem[];
    stats: { checks: number };
  }> {
    const client = this.client;
    if (!client) return { complete: true, problems: [], stats: { checks: 0 } };

    const problems: QualityProblem[] = [];
    let checks = 0;

    const [measureLinks, surveyLinks, analysisLinks, floors] =
      await Promise.all([
        client.auditMeasure.findMany({
          where: { auditId },
          include: {
            measure: {
              select: {
                id: true,
                idLinkLive: true,
                raw: true,
                createdAt: true,
                unitName: true,
              },
            },
          },
        }),
        client.auditSurvey.findMany({
          where: { auditId },
          include: {
            survey: {
              select: {
                id: true,
                idLinkLive: true,
                image: true,
                _count: { select: { points: true } },
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
                _count: { select: { hosts: true } },
              },
            },
          },
        }),
        client.auditFloor.findMany({ where: { auditId } }),
      ]);

    // ---- Medidas ----
    if (measureLinks.length === 0) {
      problems.push({
        severity: "WARNING",
        code: "no_measures",
        message: "La auditoría no tiene medidas vinculadas.",
        refs: [],
      });
    }
    checks += 1;

    const labelsSeen = new Map<string, number>();
    for (const link of measureLinks) {
      const ref = link.measure.idLinkLive ?? link.measure.id;
      const raw = (link.measure.raw ?? {}) as Record<string, unknown>;

      if (!raw || Object.keys(raw).length === 0) {
        problems.push({
          severity: "ERROR",
          code: "measure_without_raw",
          message: `Medida ${ref} sin datos Link-Live almacenados.`,
          refs: [ref],
        });
      }
      checks += 1;

      if (!link.measure.createdAt) {
        problems.push({
          severity: "WARNING",
          code: "measure_without_date",
          message: `Medida ${ref} sin fecha.`,
          refs: [ref],
        });
      }
      checks += 1;

      if (
        parseNum(raw["linkSignalLevelMean"]) === null &&
        parseNum(raw["linkSNRMean"]) === null
      ) {
        problems.push({
          severity: "INFO",
          code: "measure_link_metrics_missing",
          message: `Medida ${ref} no registra métricas de enlace (posible fallo de asociación).`,
          refs: [ref],
        });
      }
      checks += 1;

      if (floors.length > 0 && link.floorId === null) {
        problems.push({
          severity: "INFO",
          code: "measure_without_floor",
          message: `Medida ${ref} sin planta asignada.`,
          refs: [ref],
        });
      }
      checks += 1;

      if (link.label) {
        labelsSeen.set(link.label, (labelsSeen.get(link.label) ?? 0) + 1);
      }
    }

    for (const [label, count] of labelsSeen) {
      if (count > 1) {
        problems.push({
          severity: "WARNING",
          code: "duplicate_label",
          message: `La etiqueta «${label}» se repite en ${count} medidas.`,
          refs: [label],
        });
      }
      checks += 1;
    }

    // ---- Encuestas ----
    for (const link of surveyLinks) {
      const ref = link.survey.idLinkLive;
      if (!link.survey.image) {
        problems.push({
          severity: "ERROR",
          code: "survey_without_floorplan",
          message: `Encuesta ${ref} sin plano descargado.`,
          refs: [String(link.survey.id)],
        });
      }
      checks += 1;

      if ((link.survey._count?.points ?? 0) === 0) {
        problems.push({
          severity: "ERROR",
          code: "survey_without_points",
          message: `Encuesta ${ref} sin puntos de medición.`,
          refs: [String(link.survey.id)],
        });
      }
      checks += 1;
    }

    // ---- Análisis ----
    for (const link of analysisLinks) {
      if ((link.analysis._count?.hosts ?? 0) === 0) {
        problems.push({
          severity: "WARNING",
          code: "analysis_without_hosts",
          message: `Análisis ${link.analysis.idLinkLive} sin hosts almacenados.`,
          refs: [String(link.analysis.id)],
        });
      }
      checks += 1;
    }

    return {
      complete: problems.filter((p) => p.severity !== "INFO").length === 0,
      problems,
      stats: { checks },
    };
  }
}
