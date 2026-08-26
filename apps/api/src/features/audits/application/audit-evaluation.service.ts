import { Injectable, Logger } from "@nestjs/common";

import { Prisma } from "@prisma/client";

import { DatabaseService } from "@core/database/database.service";
import {
  AuditCategory,
  AuditThresholds,
  EvaluationMetric,
  EvaluationResult,
  EvaluationStatus,
} from "@features/audits/domain/entities/audit.types";
import { DEFAULT_THRESHOLDS } from "@features/audits/domain/entities/profile-presets";
import { AuditsService } from "./audits.service";
import { AuditIssueService } from "./audit-issue.service";
import { AuditRecommendationService } from "./audit-recommendation.service";
import {
  evalCount,
  evalHigher,
  evalLower,
  interpretConnectivityArray,
  normalizePercent,
  parseNum,
  reasonsHintFailure,
  unknownResult,
} from "./evaluation-lib";

type RawRecord = Record<string, unknown>;

interface MeasureWithRaw {
  measureId: string;
  idLinkLive: string | null;
  label: string | null;
  floorId: number | null;
  raw: unknown;
}

@Injectable()
export class AuditEvaluationService {
  private readonly logger = new Logger(AuditEvaluationService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly auditsService: AuditsService,
    private readonly issueService: AuditIssueService,
    private readonly recommendationService: AuditRecommendationService
  ) {}

  private get client() {
    return this.database.getClient();
  }

  private mergeThresholds(profile: unknown): AuditThresholds {
    const raw =
      profile && typeof profile === "object"
        ? (profile as { thresholds?: Partial<AuditThresholds> }).thresholds
        : undefined;
    return {
      coverage: {
        ...DEFAULT_THRESHOLDS.coverage,
        ...(raw?.coverage ?? {}),
        rssi: { ...DEFAULT_THRESHOLDS.coverage.rssi, ...(raw?.coverage?.rssi ?? {}) },
        snr: { ...DEFAULT_THRESHOLDS.coverage.snr, ...(raw?.coverage?.snr ?? {}) },
        minPassRatePct: {
          ...DEFAULT_THRESHOLDS.coverage.minPassRatePct,
          ...(raw?.coverage?.minPassRatePct ?? {}),
        },
      },
      radio: {
        ...DEFAULT_THRESHOLDS.radio,
        ...(raw?.radio ?? {}),
        channelUtilizationPct: {
          ...DEFAULT_THRESHOLDS.radio.channelUtilizationPct,
          ...(raw?.radio?.channelUtilizationPct ?? {}),
        },
      },
      performance: {
        ...DEFAULT_THRESHOLDS.performance,
        ...(raw?.performance ?? {}),
      },
    };
  }

  /**
   * Ejecuta el motor completo sobre una auditoría:
   * evaluaciones → checklist automático → incidencias sugeridas →
   * recomendaciones → borrador de conclusiones.
   */
  async evaluateAudit(auditId: string) {
    const audit = await this.auditsService.getByIdOrThrow(auditId);
    // El checklist se re-instancia para incorporar ítems añadidos al perfil.
    await this.auditsService.seedChecklist(auditId);
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");

    const thresholds = this.mergeThresholds(audit.profile);
    const results: EvaluationResult[] = [];

    const [measureLinks, surveyLinks, analysisLinks] = await Promise.all([
      client.auditMeasure.findMany({
        where: { auditId },
        include: { measure: { select: { id: true, idLinkLive: true, raw: true } } },
      }),
      client.auditSurvey.findMany({
        where: { auditId },
        include: { survey: { select: { id: true, idLinkLive: true, name: true, surveyName: true } } },
      }),
      client.auditAnalysis.findMany({
        where: { auditId },
        select: { analysis: { select: { id: true, apsCount: true, ssidsCount: true, clientsCount: true } } },
      }),
    ]);

    const measures: MeasureWithRaw[] = measureLinks.map((link: any) => ({
      measureId: link.measure.id,
      idLinkLive: link.measure.idLinkLive,
      label: link.label,
      floorId: link.floorId,
      raw: link.measure.raw,
    }));

    for (const measure of measures) {
      results.push(...this.extractFromMeasure(measure, thresholds));
    }

    for (const link of surveyLinks as any[]) {
      const points = await client.linkLiveSurveyPoint.findMany({
        where: { surveyId: link.survey.id },
      });
      results.push(
        ...this.extractFromSurvey(
          {
            surveyId: String(link.survey.id),
            guid: link.survey.idLinkLive,
            name: link.survey.name ?? link.survey.surveyName ?? `Survey ${link.survey.id}`,
          },
          points as Array<{ metric: string; value: number | null }>,
          thresholds,
          link.floorId
        )
      );
    }

    // Rendimiento y movilidad: solo si existen datos reales; si no, NO REALIZADA.
    const hasPerformanceData = measures.some((m) =>
      Object.keys((m.raw as RawRecord) ?? {}).some((key) =>
        /iperf|throughput|latency|packetLoss/i.test(key)
      )
    );
    if (!hasPerformanceData) {
      results.push(this.notPerformed("RENDIMIENTO", "DOWNLOAD", "Prueba de rendimiento (iPerf) no realizada o no disponible en los datos capturados."));
    }
    results.push(
      this.notPerformed("MOVILIDAD", "ROAMING", "Prueba de roaming no realizada o datos no disponibles.")
    );

    // Persistencia: sustituye el lote anterior de evaluaciones.
    const batchId = `run-${Date.now()}`;
    await client.auditEvaluation.deleteMany({ where: { auditId } });
    if (results.length > 0) {
      await client.auditEvaluation.createMany({
        data: results.map((result) => ({
          auditId,
          category: result.category,
          metric: result.metric,
          value: result.value,
          unit: result.unit,
          status: result.status,
          threshold: (result.threshold ?? undefined) as unknown as Prisma.InputJsonValue,
          message: result.message,
          sourceType: result.sourceType,
          sourceId: result.sourceId,
          sourceGuid: result.sourceGuid,
          floorId: result.floorId ?? null,
          locationLabel: result.locationLabel ?? null,
          batchId,
        })),
      });
    }

    await this.autoCompleteChecklist(auditId, results, {
      measures: measureLinks.length,
      analyses: analysisLinks.length,
      surveys: (surveyLinks as Array<{ survey: { image?: string | null } }>).map(
        (link) => ({ hasImage: Boolean(link.survey.image) })
      ),
    });

    const issues = await this.issueService.detectFromEvaluations(auditId, results);
    const recommendations = await this.recommendationService.generateFromEvaluations(auditId, results);
    const globalResult = await this.generateConclusionDraft(auditId);

    return {
      batchId,
      total: results.length,
      byStatus: {
        PASS: results.filter((r) => r.status === "PASS").length,
        WARNING: results.filter((r) => r.status === "WARNING").length,
        FAIL: results.filter((r) => r.status === "FAIL").length,
        UNKNOWN: results.filter((r) => r.status === "UNKNOWN").length,
      },
      suggestedIssues: issues.created,
      skippedIssues: issues.skipped,
      recommendations: recommendations.created,
      globalResult,
    };
  }

  private notPerformed(category: AuditCategory, metric: EvaluationMetric | string, message: string): EvaluationResult {
    return {
      category,
      metric,
      value: null,
      unit: null,
      status: "UNKNOWN",
      message,
      sourceType: null,
      sourceId: null,
      sourceGuid: null,
    };
  }

  // ---------- Extracción desde medidas ----------

  private extractFromMeasure(
    entry: MeasureWithRaw,
    thresholds: AuditThresholds
  ): EvaluationResult[] {
    const raw = (entry.raw ?? {}) as RawRecord;
    if (!raw || typeof raw !== "object" || Object.keys(raw).length === 0) {
      return [
        this.notPerformed("RADIO", "OVERALL_RESULT", "La medida vinculada no tiene datos Link-Live almacenados."),
      ];
    }

    const location = entry.label;
    const sourceRef = {
      sourceType: "MEASURE" as const,
      sourceId: entry.measureId,
      sourceGuid: entry.idLinkLive,
      floorId: entry.floorId,
      locationLabel: location,
    };

    const out: EvaluationResult[] = [];

    // Enlace RF
    const rssi = parseNum(raw["linkSignalLevelMean"]);
    const snr = parseNum(raw["linkSNRMean"]);
    const noise = parseNum(raw["linkNoiseLevelMean"]);

    const rssiEval = evalHigher(rssi, thresholds.coverage.rssi, "dBm", "RSSI");
    out.push({ category: "RADIO", metric: "RSSI", ...sourceRef, ...rssiEval });

    const snrEval = evalHigher(snr, thresholds.coverage.snr, "dB", "SNR");
    out.push({ category: "RADIO", metric: "SNR", ...sourceRef, ...snrEval });

    const noiseEval = rssiEval.status === "PASS" && noise !== null
      ? unknownResult(`Ruido medio ${noise} dBm registrado; sin umbral de conformidad configurado.`, noise)
      : unknownResult("Ruido: dato no disponible.");
    out.push({ category: "RADIO", metric: "NOISE", ...sourceRef, ...noiseEval });

    // Sesión: utilización e interferencias
    const utilValues = this.collectSeriesValues(raw["channelUtilArray"], ["util", "utilization", "value", "y"]);
    const nonWifiValues = this.collectSeriesValues(raw["channelNon80211UtilArray"], ["util", "utilization", "value", "y"]);
    const coChannelValues = this.collectSeriesValues(raw["coChannelInterference"], ["aps", "apsCount", "count", "devices", "value"]);
    const adjacentValues = this.collectSeriesValues(raw["adjacentChannelInterference"], ["aps", "apsCount", "count", "devices", "value"]);

    const worstUtilChannel = this.findWorstChannel(raw["channelUtilArray"], ["util", "utilization", "value", "y"]);

    const utilEval = evalLower(
      normalizePercent(utilValues),
      thresholds.radio.channelUtilizationPct,
      "%",
      "Utilización de canal"
    );
    if (worstUtilChannel !== null && utilEval.status !== "UNKNOWN") {
      utilEval.message += ` Peor canal: ${worstUtilChannel}.`;
    }
    out.push({ category: "RADIO", metric: "CHANNEL_UTILIZATION", ...sourceRef, ...utilEval });

    out.push({
      category: "RADIO",
      metric: "NON_WIFI_UTILIZATION",
      ...sourceRef,
      ...evalLower(normalizePercent(nonWifiValues), thresholds.radio.nonWifiUtilizationPct, "%", "Utilización no Wi-Fi"),
    });

    const coChannelMax = coChannelValues.length > 0 ? Math.max(...coChannelValues.map((v) => Math.round(v))) : null;
    out.push({
      category: "RADIO",
      metric: "CO_CHANNEL_INTERFERENCE",
      ...sourceRef,
      ...evalCount(coChannelMax, thresholds.radio.coChannelApCount, "APs co-canal"),
    });

    const adjacentMax = adjacentValues.length > 0 ? Math.max(...adjacentValues.map((v) => Math.round(v))) : null;
    out.push({
      category: "RADIO",
      metric: "ADJACENT_CHANNEL_INTERFERENCE",
      ...sourceRef,
      ...evalCount(adjacentMax, thresholds.radio.adjacentChannelApCount, "Redes adyacentes"),
    });

    const rogueCount = Array.isArray(raw["rogueAps"]) ? (raw["rogueAps"] as unknown[]).length : null;
    out.push({
      category: "RADIO",
      metric: "ROGUE_APS",
      ...sourceRef,
      ...evalCount(rogueCount, thresholds.radio.rogueApsMax, "APs rogue detectados"),
    });

    // Conectividad
    out.push(...this.extractConnectivity(raw, sourceRef));

    // Resultado global del equipo (veredicto del AirCheck G3, se muestra tal cual)
    const overallColor = typeof raw["overallColor"] === "string" ? raw["overallColor"] : null;
    const failures = [...this.asStringArray(raw["failureReasons"]), ...this.asStringArray(raw["linkFailureReasons"])];
    const overallMap: Record<string, EvaluationStatus> = { green: "PASS", yellow: "WARNING", red: "FAIL" };
    const overallStatus =
      overallColor && overallMap[overallColor]
        ? overallMap[overallColor]
        : rssi === null && snr === null
          ? "UNKNOWN"
          : "UNKNOWN";
    out.push({
      category: "RADIO",
      metric: "OVERALL_RESULT",
      ...sourceRef,
      value: null,
      unit: null,
      status: overallStatus,
      message:
        overallColor === null
          ? "El resultado del equipo no está disponible."
          : `Resultado del equipo (${overallColor})${failures.length > 0 ? `. Motivos: ${failures.join(" · ")}` : ""}.`,
    });

    return out;
  }

  private extractConnectivity(
    raw: RawRecord,
    sourceRef: Pick<EvaluationResult, "sourceType" | "sourceId" | "sourceGuid" | "floorId" | "locationLabel">
  ): EvaluationResult[] {
    const out: EvaluationResult[] = [];
    const metrics: Array<{ metric: string; key: string; label: string; reasons?: string; reasonKeywords: string[] }> = [
      { metric: "DHCP", key: "dhcpConnect", label: "DHCP", reasonKeywords: ["dhcp"] },
      { metric: "GATEWAY", key: "routerConnect", label: "Gateway", reasonKeywords: ["gateway", "router", "enrutador"] },
      { metric: "DNS", key: "dns", label: "DNS", reasonKeywords: ["dns"] },
      { metric: "HTTP_HTTPS", key: "www", label: "HTTP/HTTPS", reasonKeywords: ["http", "web", "www"] },
    ];

    const ipConfigReasons = raw["ipConfigFailureReasons"];
    const hasAssociation = parseNum(raw["linkSignalLevelMean"]) !== null;

    for (const item of metrics) {
      const interpretation = interpretConnectivityArray(raw[item.key]);
      let status = interpretation.status;
      let message = `${item.label}: ${interpretation.detail}.`;

      if (!interpretation.ran && item.reasonKeywords.length > 0) {
        const hinted = reasonsHintFailure(ipConfigReasons, item.reasonKeywords);
        if (hinted) {
          status = "FAIL";
          message = `${item.label}: fallo confirmado por el equipo ("${hinted}").`;
        }
      }

      out.push({ category: "CONECTIVIDAD", metric: item.metric, ...sourceRef, value: null, unit: null, status, message });
    }

    // Asociación: si hay métricas de enlace, el equipo llegó a asociarse.
    const linkFailures = this.asStringArray(raw["linkFailureReasons"]);
    out.push({
      category: "CONECTIVIDAD",
      metric: "ASSOCIATION",
      ...sourceRef,
      value: null,
      unit: null,
      status: hasAssociation ? "PASS" : linkFailures.length > 0 ? "FAIL" : "UNKNOWN",
      message: hasAssociation
        ? "Asociación al SSID establecida (el equipo obtuvo métricas de enlace)."
        : linkFailures.length > 0
          ? `Asociación fallida: ${linkFailures.join(" · ")}.`
          : "Asociación: sin datos suficientes.",
    });

    // Internet: la prueba www es el indicador disponible; ping dedicado no existe en el raw.
    const wwwInterpretation = interpretConnectivityArray(raw["www"]);
    const dnsInterpretation = interpretConnectivityArray(raw["dns"]);
    const internetStatus =
      wwwInterpretation.status === "PASS"
        ? "PASS"
        : wwwInterpretation.status === "FAIL"
          ? "FAIL"
          : dnsInterpretation.status === "FAIL"
            ? "FAIL"
            : "UNKNOWN";
    out.push({
      category: "CONECTIVIDAD",
      metric: "INTERNET",
      ...sourceRef,
      value: null,
      unit: null,
      status: internetStatus,
      message:
        internetStatus === "UNKNOWN"
          ? "Internet: sin comprobación directa disponible (no hay prueba HTTP/DNS registrada)."
          : `Internet: ${internetStatus === "PASS" ? "acceso verificado mediante prueba HTTP." : "acceso con fallo según las pruebas realizadas."}`,
    });

    return out;
  }

  // ---------- Extracción desde surveys ----------

  private extractFromSurvey(
    survey: { surveyId: string; guid: string; name: string },
    points: Array<{ metric: string; value: number | null }>,
    thresholds: AuditThresholds,
    floorId: number | null
  ): EvaluationResult[] {
    const sourceRef = {
      sourceType: "SURVEY" as const,
      sourceId: survey.surveyId,
      sourceGuid: survey.guid,
      floorId,
      locationLabel: survey.name,
    };
    const out: EvaluationResult[] = [];

    const signalPoints = points.filter((p) => p.metric === "signal" && p.value !== null).map((p) => p.value as number);
    const snrPoints = points.filter((p) => p.metric === "snr" && p.value !== null).map((p) => p.value as number);

    for (const [metric, values, threshold] of [
      ["RSSI", signalPoints, thresholds.coverage.rssi],
      ["SNR", snrPoints, thresholds.coverage.snr],
    ] as const) {
      if (values.length === 0) continue;
      const passMin = threshold.passMin;
      if (passMin === undefined) continue;
      const warnMin = threshold.warnMin ?? passMin;

      const fails = values.filter((v) => v < warnMin).length;
      const warnings = values.filter((v) => v >= warnMin && v < passMin).length;
      const pctBad = Math.round(((fails + warnings) / values.length) * 1000) / 10;

      const min = Math.min(...values);
      const minEval = evalHigher(min, threshold, "dBm", `${metric} mínimo`);
      out.push({
        category: "COBERTURA",
        metric: metric === "RSSI" ? "COVERAGE_MIN_RSSI" : "COVERAGE_MIN_SNR",
        ...sourceRef,
        ...minEval,
      });

      const rateEval = evalLower(pctBad, thresholds.coverage.minPassRatePct, "%", `Puntos fuera de objetivo (${metric})`);
      rateEval.message =
        `Cobertura ${survey.name}: ${fails} punto(s) FAIL y ${warnings} WARNING de ${values.length} ` +
        `(${pctBad}% por debajo del objetivo).`;
      out.push({ category: "COBERTURA", metric: "COVERAGE_PASS_RATE", ...sourceRef, ...rateEval });
    }

    if (signalPoints.length === 0 && snrPoints.length === 0) {
      out.push({
        category: "COBERTURA",
        metric: "COVERAGE_PASS_RATE",
        ...sourceRef,
        value: null,
        unit: null,
        status: "UNKNOWN",
        message: "Survey sin puntos de medición utilizables.",
      });
    }

    return out;
  }

  // ---------- Utilidades ----------

  private collectSeriesValues(series: unknown, valueKeys: string[]): number[] {
    if (!Array.isArray(series)) return [];
    const values: number[] = [];
    for (const item of series) {
      if (item === null || typeof item !== "object") continue;
      const record = item as RawRecord;
      for (const key of valueKeys) {
        const parsed = parseNum(record[key]);
        if (parsed !== null) {
          values.push(parsed);
          break;
        }
      }
    }
    return values;
  }

  private findWorstChannel(series: unknown, valueKeys: string[]): string | null {
    if (!Array.isArray(series)) return null;
    let worstValue = -Infinity;
    let worstChannel: string | null = null;
    for (const item of series) {
      if (item === null || typeof item !== "object") continue;
      const record = item as RawRecord;
      let value: number | null = null;
      for (const key of valueKeys) {
        const parsed = parseNum(record[key]);
        if (parsed !== null) {
          value = parsed;
          break;
        }
      }
      if (value !== null && value > worstValue) {
        worstValue = value;
        worstChannel = String(record["channel"] ?? record["ch"] ?? record["channelNumber"] ?? "?");
      }
    }
    return worstChannel;
  }

  private asStringArray(value: unknown): string[] {
    return Array.isArray(value) ? value.map((item) => String(item)).filter(Boolean) : [];
  }

  /** Marca automáticamente los ítems de checklist que quedan satisfechos por datos. */
  private async autoCompleteChecklist(
    auditId: string,
    results: EvaluationResult[],
    sources: { measures: number; analyses: number; surveys: Array<{ hasImage: boolean }> }
  ) {
    const client = this.client;
    if (!client) return;

    const tests = await client.auditTest.findMany({
      where: { auditId, status: "PENDIENTE" },
    });
    if (tests.length === 0) return;

    const byMetric = new Map<string, EvaluationResult[]>();
    for (const result of results) {
      const list = byMetric.get(result.metric) ?? [];
      list.push(result);
      byMetric.set(result.metric, list);
    }

    const bestStatusFor = (metric: string): EvaluationResult | null => {
      const list = byMetric.get(metric) ?? [];
      const order: Record<string, number> = { FAIL: 3, WARNING: 2, PASS: 1 };
      if (list.length === 0) return null;
      return list.reduce((worst, current) =>
        (order[current.status] ?? 0) >= (order[worst.status] ?? 0) ? current : worst
      );
    };

    const evidenceMap: Record<string, string[]> = {
      "rf.channel_utilization": ["CHANNEL_UTILIZATION"],
      "rf.interference": ["CO_CHANNEL_INTERFERENCE", "ADJACENT_CHANNEL_INTERFERENCE"],
      "rf.co_channel": ["CO_CHANNEL_INTERFERENCE"],
      "rf.adjacent_channel": ["ADJACENT_CHANNEL_INTERFERENCE"],
      "rf.rogue_aps": ["ROGUE_APS"],
      "cov.rssi": ["RSSI", "COVERAGE_MIN_RSSI"],
      "cov.snr": ["SNR", "COVERAGE_MIN_SNR"],
      "cov.noise": ["NOISE"],
      "conn.dhcp": ["DHCP"],
      "conn.gateway": ["GATEWAY"],
      "conn.dns": ["DNS"],
      "conn.internet": ["INTERNET"],
      "conn.http_https": ["HTTP_HTTPS"],
      "conn.ping_lan": ["GATEWAY"],
    };

    // Contexto adicional para reglas de existencia de datos.
    const [auditRow, reportsCount, issuesCount] = await Promise.all([
      client.audit.findUnique({
        where: { id: auditId },
        select: { lastSyncAt: true },
      }),
      client.auditReport.count({ where: { auditId } }),
      client.auditIssue.count({ where: { auditId, state: { not: "DESCARTADA" } } }),
    ]);

    const surveysWithPlan = sources.surveys.filter((survey) => survey.hasImage).length;

    const markDone = async (
      test: { id: string },
      resultStatus: "PASS" | "WARNING" | "FAIL" | "UNKNOWN",
      notes: string,
      source?: { type: string | null; id: unknown; guid: string | null }
    ) => {
      await client.auditTest.update({
        where: { id: test.id },
        data: {
          status: "COMPLETADA",
          completedAt: new Date(),
          resultStatus,
          ...(source
            ? {
                sourceIds: [
                  { type: source.type, id: source.id, guid: source.guid },
                ] as unknown as Prisma.InputJsonValue,
              }
            : {}),
          notes,
        },
      });
    };

    for (const test of tests) {
      if (test.key === "pre.equipment") {
        if (sources.measures > 0) {
          await markDone(test, "PASS", "Completado automáticamente: existen medidas vinculadas.");
        }
        continue;
      }

      if (test.key === "pre.floorplans") {
        if (surveysWithPlan > 0) {
          await markDone(
            test,
            "PASS",
            `Completado automáticamente: ${surveysWithPlan} encuesta(s) con plano cargado.`
          );
        }
        continue;
      }

      const metricKeys = evidenceMap[test.key];
      if (metricKeys) {
        const candidates = metricKeys
          .map((metric) => bestStatusFor(metric))
          .filter((candidate): candidate is EvaluationResult => candidate !== null && candidate.status !== "UNKNOWN");
        const chosen =
          candidates.find((c) => c.status === "FAIL") ??
          candidates.find((c) => c.status === "WARNING") ??
          candidates[0];
        if (chosen) {
          await markDone(
            test,
            chosen.status as "PASS" | "WARNING" | "FAIL",
            "Verificado automáticamente por el motor de evaluación.",
            { type: chosen.sourceType, id: chosen.sourceId, guid: chosen.sourceGuid }
          );
        }
        continue;
      }

      if (
        test.key === "cov.plan_loaded" ||
        test.key === "cov.airmapper"
      ) {
        if (sources.surveys.length > 0) {
          await markDone(
            test,
            "PASS",
            `Completado automáticamente: ${sources.surveys.length} encuesta(s) AirMapper vinculada(s).`
          );
        }
        continue;
      }

      if (
        ["rf.wifi_analysis", "rf.aps_identified", "rf.ssids_identified", "rf.channels_analyzed"].includes(
          test.key
        ) &&
        sources.analyses > 0
      ) {
        await markDone(
          test,
          "PASS",
          "Completado automáticamente: existe análisis Wi-Fi vinculado."
        );
        continue;
      }

      if (test.key === "close.data_synced" && auditRow?.lastSyncAt) {
        await markDone(
          test,
          "PASS",
          `Completado automáticamente: sincronización ejecutada el ${new Date(
            auditRow.lastSyncAt
          ).toLocaleString("es-ES")}.`
        );
        continue;
      }

      if (test.key === "close.report_generated" && reportsCount > 0) {
        await markDone(test, "PASS", `Completado automáticamente: ${reportsCount} versión(es) de informe.`);
        continue;
      }

      if (test.key === "close.issues_documented") {
        // Con evaluación ejecutada hay incidencias sugeridas o cero incidencias:
        // se considera documentado cuando existe al menos una o la evaluación pasó.
        if (issuesCount > 0) {
          await markDone(test, "PASS", `Completado automáticamente: ${issuesCount} incidencia(s) registradas.`);
        }
        continue;
      }

      if (test.key === "close.recommendations_added") {
        const allRecs = await client.auditRecommendation.count({ where: { auditId } });
        if (allRecs > 0) {
          await markDone(test, "PASS", `Completado automáticamente: ${allRecs} recomendación(es) generadas.`);
        }
        continue;
      }
    }
  }

  /** Calcula el resultado global y guarda el borrador de conclusiones. */
  async generateConclusionDraft(auditId: string): Promise<string> {
    const dashboard = await this.auditsService.getDashboard(auditId);
    const evaluations = dashboard.evaluations;
    const meaningful = evaluations.total - evaluations.UNKNOWN;

    let globalResult: string;
    if (meaningful <= 0) {
      globalResult = "SIN_DATOS_SUFICIENTES";
    } else if (evaluations.FAIL > 0) {
      globalResult = "NO_CONFORME";
    } else if (evaluations.WARNING > 0) {
      globalResult = "APROBADO_CON_OBSERVACIONES";
    } else {
      globalResult = "APROBADO";
    }

    const paragraphs: string[] = [];
    if (meaningful > 0) {
      paragraphs.push(
        `Se han evaluado ${meaningful} condiciones técnicas: ${evaluations.PASS} conformes (${evaluations.pctPass}%), ` +
          `${evaluations.WARNING} con advertencias y ${evaluations.FAIL} no conformes.`
      );
      if (evaluations.FAIL > 0) {
        paragraphs.push(
          "Existen incumplimientos respecto a los criterios de aceptación definidos que deben revisarse antes de la puesta en servicio."
        );
      } else if (evaluations.WARNING > 0) {
        paragraphs.push(
          "No se han detectado incumplimientos graves; se recomienda atender los puntos señalados con advertencia para dar margen operativo."
        );
      } else {
        paragraphs.push(
          "Los parámetros evaluados cumplen los criterios de aceptación definidos para este perfil de auditoría."
        );
      }
    } else {
      paragraphs.push(
        "No disponemos de datos evaluables suficientes para emitir un diagnóstico. Complete las pruebas pendientes del checklist y vuelva a ejecutar el análisis."
      );
    }
    if (dashboard.discovery.aps > 0) {
      paragraphs.push(
        `Durante el reconocimiento se detectaron ${dashboard.discovery.aps} puntos de acceso, ${dashboard.discovery.ssids} SSIDs y ${dashboard.discovery.clients} clientes asociados.`
      );
    }

    const draft = paragraphs.join("\n\n");

    const client = this.client;
    if (client) {
      const existing = await client.auditConclusion.findUnique({ where: { auditId } });
      if (existing) {
        // No se sobreescribe el texto final editado por el técnico ni un
        // borrador ya validado manualmente (editedAt posterior).
        await client.auditConclusion.update({
          where: { auditId },
          data: { draft, generatedAt: new Date() },
        });
      } else {
        await client.auditConclusion.create({
          data: { auditId, draft, globalResult, generatedAt: new Date() },
        });
      }
      if (!existing || !existing.finalText) {
        await client.auditConclusion.update({
          where: { auditId },
          data: { globalResult },
        });
      }
    }

    return globalResult;
  }
}
