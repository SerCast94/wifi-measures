import { Injectable, Logger, NotFoundException } from "@nestjs/common";

import { Prisma } from "@prisma/client";

import { DatabaseService } from "@core/database/database.service";
import {
  EvaluationResult,
  IssueSeverity,
  SEVERITY_ORDER,
} from "@features/audits/domain/entities/audit.types";

interface IssueRule {
  metric: string;
  statuses: Array<"FAIL" | "WARNING">;
  severityFor: Record<"FAIL" | "WARNING", IssueSeverity>;
  type: string;
  title: string;
  description: string;
}

/**
 * Reglas declarativas de detección automática. Cada incidencia generada
 * guarda la referencia a la evaluación que la originó (trazabilidad).
 */
const ISSUE_RULES: IssueRule[] = [
  {
    metric: "RSSI",
    statuses: ["FAIL", "WARNING"],
    severityFor: { FAIL: "HIGH", WARNING: "LOW" },
    type: "COBERTURA",
    title: "Señal insuficiente (RSSI)",
    description:
      "La potencia de señal recibida está por debajo del nivel recomendado en el punto de medida.",
  },
  {
    metric: "SNR",
    statuses: ["FAIL", "WARNING"],
    severityFor: { FAIL: "HIGH", WARNING: "LOW" },
    type: "COBERTURA",
    title: "SNR insuficiente",
    description:
      "La relación señal/ruido está por debajo del objetivo; posible interferencia o cobertura débil.",
  },
  {
    metric: "CHANNEL_UTILIZATION",
    statuses: ["FAIL", "WARNING"],
    severityFor: { FAIL: "MEDIUM", WARNING: "LOW" },
    type: "RADIO",
    title: "Canal saturado",
    description:
      "La utilización del canal supera el umbral definido para el perfil de auditoría.",
  },
  {
    metric: "NON_WIFI_UTILIZATION",
    statuses: ["FAIL"],
    severityFor: { FAIL: "MEDIUM", WARNING: "LOW" },
    type: "RADIO",
    title: "Utilización no Wi-Fi elevada",
    description:
      "Se detecta ocupación espectral no Wi-Fi relevante en los canales analizados.",
  },
  {
    metric: "CO_CHANNEL_INTERFERENCE",
    statuses: ["FAIL", "WARNING"],
    severityFor: { FAIL: "MEDIUM", WARNING: "LOW" },
    type: "RADIO",
    title: "Exceso de interferencia co-canal",
    description:
      "Demasiadas redes compartiendo el mismo canal; degrada el rendimiento disponible.",
  },
  {
    metric: "ADJACENT_CHANNEL_INTERFERENCE",
    statuses: ["FAIL"],
    severityFor: { FAIL: "LOW", WARNING: "INFO" },
    type: "RADIO",
    title: "Interferencia de canal adyacente",
    description:
      "Redes en canales adyacentes con solapamiento espectral apreciable.",
  },
  {
    metric: "ROGUE_APS",
    statuses: ["FAIL", "WARNING"],
    severityFor: { FAIL: "MEDIUM", WARNING: "LOW" },
    type: "RADIO",
    title: "Puntos de acceso no autorizados",
    description:
      "Se han detectado APs clasificados como rogue por el equipo de medida.",
  },
  {
    metric: "DHCP",
    statuses: ["FAIL"],
    severityFor: { FAIL: "HIGH", WARNING: "MEDIUM" },
    type: "CONECTIVIDAD",
    title: "Fallo de DHCP",
    description:
      "El equipo no obtuvo configuración IP mediante DHCP en el punto comprobado.",
  },
  {
    metric: "GATEWAY",
    statuses: ["FAIL"],
    severityFor: { FAIL: "HIGH", WARNING: "MEDIUM" },
    type: "CONECTIVIDAD",
    title: "Gateway inaccesible",
    description:
      "No se alcanza la pasarela por defecto desde el punto de medida.",
  },
  {
    metric: "DNS",
    statuses: ["FAIL"],
    severityFor: { FAIL: "HIGH", WARNING: "MEDIUM" },
    type: "CONECTIVIDAD",
    title: "Fallo de resolución DNS",
    description:
      "Las consultas DNS no se resuelven correctamente en el punto comprobado.",
  },
  {
    metric: "INTERNET",
    statuses: ["FAIL"],
    severityFor: { FAIL: "CRITICAL", WARNING: "HIGH" },
    type: "CONECTIVIDAD",
    title: "Sin acceso a Internet",
    description:
      "No hay salida a Internet verificable desde el punto de medida.",
  },
  {
    metric: "HTTP_HTTPS",
    statuses: ["FAIL"],
    severityFor: { FAIL: "HIGH", WARNING: "MEDIUM" },
    type: "CONECTIVIDAD",
    title: "Fallo de acceso HTTP/HTTPS",
    description:
      "El tráfico web no funciona correctamente en el punto comprobado.",
  },
  {
    metric: "ASSOCIATION",
    statuses: ["FAIL"],
    severityFor: { FAIL: "HIGH", WARNING: "MEDIUM" },
    type: "CONECTIVIDAD",
    title: "Fallo de asociación al SSID",
    description: "El equipo no consiguió asociarse al SSID objetivo.",
  },
  {
    metric: "DOWNLOAD",
    statuses: ["FAIL", "WARNING"],
    severityFor: { FAIL: "MEDIUM", WARNING: "LOW" },
    type: "RENDIMIENTO",
    title: "Throughput de descarga insuficiente",
    description:
      "El ancho de banda de descarga medido está por debajo del mínimo definido.",
  },
  {
    metric: "UPLOAD",
    statuses: ["FAIL", "WARNING"],
    severityFor: { FAIL: "MEDIUM", WARNING: "LOW" },
    type: "RENDIMIENTO",
    title: "Throughput de subida insuficiente",
    description:
      "El ancho de banda de subida medido está por debajo del mínimo definido.",
  },
  {
    metric: "LATENCY",
    statuses: ["FAIL", "WARNING"],
    severityFor: { FAIL: "MEDIUM", WARNING: "LOW" },
    type: "RENDIMIENTO",
    title: "Latencia excesiva",
    description: "La latencia medida supera el máximo definido en el perfil.",
  },
  {
    metric: "PACKET_LOSS",
    statuses: ["FAIL", "WARNING"],
    severityFor: { FAIL: "MEDIUM", WARNING: "LOW" },
    type: "RENDIMIENTO",
    title: "Pérdida de paquetes",
    description: "La pérdida de paquetes medida supera el máximo tolerable.",
  },
  {
    metric: "COVERAGE_PASS_RATE",
    statuses: ["FAIL", "WARNING"],
    severityFor: { FAIL: "HIGH", WARNING: "MEDIUM" },
    type: "COBERTURA",
    title: "Zonas con cobertura deficiente",
    description:
      "Un porcentaje significativo de puntos del mapa de calor no alcanza el objetivo de cobertura.",
  },
];

@Injectable()
export class AuditIssueService {
  private readonly logger = new Logger(AuditIssueService.name);

  constructor(private readonly database: DatabaseService) {}

  private get client() {
    return this.database.getClient();
  }

  async list(auditId: string) {
    const client = this.client;
    if (!client) return [];
    const issues = await client.auditIssue.findMany({
      where: { auditId },
      orderBy: [{ detectedAt: "desc" }],
    });
    return issues.sort(
      (a: any, b: any) =>
        SEVERITY_ORDER[a.severity as IssueSeverity] -
        SEVERITY_ORDER[b.severity as IssueSeverity]
    );
  }

  async createManual(
    auditId: string,
    input: {
      title: string;
      description?: string;
      type?: string;
      severity?: IssueSeverity;
      locationLabel?: string;
      floorId?: number | null;
      metric?: string;
      value?: number | null;
      unit?: string;
      evidence?: unknown;
      photo?: string;
      recommendationText?: string;
    }
  ) {
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    return client.auditIssue.create({
      data: {
        auditId,
        origin: "MANUAL",
        state: "ACEPTADA",
        title: input.title,
        description: input.description ?? null,
        type: input.type ?? null,
        severity: input.severity ?? "MEDIUM",
        locationLabel: input.locationLabel ?? null,
        floorId: input.floorId ?? null,
        metric: input.metric ?? null,
        value: input.value ?? null,
        unit: input.unit ?? null,
        evidence: (input.evidence ?? undefined) as Prisma.InputJsonValue,
        photo: input.photo ?? null,
        recommendationText: input.recommendationText ?? null,
      },
    });
  }

  async update(
    auditId: string,
    issueId: string,
    input: Partial<{
      state: string;
      severity: IssueSeverity;
      title: string;
      description: string;
      type: string;
      locationLabel: string;
      recommendationText: string;
      photo: string;
    }>
  ) {
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    const issue = await client.auditIssue.findFirst({
      where: { id: issueId, auditId },
    });
    if (!issue) throw new NotFoundException("Incidencia no encontrada");

    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) data[key] = value;
    }
    // Si el técnico edita una sugerida, pasa a MODIFICADA.
    if (
      issue.state === "SUGERIDA" &&
      !input.state &&
      Object.keys(data).length > 0
    ) {
      data.state = "MODIFICADA";
    }
    return client.auditIssue.update({ where: { id: issueId }, data });
  }

  async remove(auditId: string, issueId: string) {
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    const issue = await client.auditIssue.findFirst({
      where: { id: issueId, auditId },
    });
    if (!issue) throw new NotFoundException("Incidencia no encontrada");
    await client.auditIssue.delete({ where: { id: issueId } });
    return { ok: true };
  }

  /**
   * Detección automática: genera incidencias SUGERIDA a partir de las
   * evaluaciones FAIL/WARNING, evitando duplicados con las ya existentes.
   * Las descartadas por el técnico NO se regeneran.
   */
  async detectFromEvaluations(auditId: string, results: EvaluationResult[]) {
    const client = this.client;
    if (!client) return { created: 0, skipped: 0 };

    const existing = await client.auditIssue.findMany({
      where: { auditId },
      select: { evidence: true, state: true },
    });
    const existingKeys = new Set(
      existing
        .filter((issue: any) => issue.state !== "DESCARTADA")
        .map((issue: any) => {
          const evidence = issue.evidence as { key?: string } | null;
          return evidence?.key ?? "";
        })
        .filter(Boolean)
    );
    const discardedKeys = new Set(
      existing
        .filter((issue: any) => issue.state === "DESCARTADA")
        .map((issue: any) => {
          const evidence = issue.evidence as { key?: string } | null;
          return evidence?.key ?? "";
        })
        .filter(Boolean)
    );

    let created = 0;
    let skipped = 0;

    for (const result of results) {
      const rule = ISSUE_RULES.find(
        (candidate) =>
          candidate.metric === result.metric &&
          candidate.statuses.includes(result.status as "FAIL" | "WARNING")
      );
      if (!rule) continue;

      const key = `${result.metric}:${result.sourceGuid ?? "agg"}:${result.locationLabel ?? ""}`;
      if (existingKeys.has(key)) {
        skipped += 1;
        continue;
      }
      if (discardedKeys.has(key)) continue;

      const severity = rule.severityFor[result.status as "FAIL" | "WARNING"];
      await client.auditIssue.create({
        data: {
          auditId,
          origin: "AUTO",
          state: "SUGERIDA",
          type: rule.type,
          severity,
          title: rule.title,
          description:
            result.message + (rule.description ? ` ${rule.description}` : ""),
          locationLabel: result.locationLabel ?? null,
          floorId: result.floorId ?? null,
          metric: result.metric,
          value: result.value,
          unit: result.unit,
          threshold: (result.threshold ??
            undefined) as unknown as Prisma.InputJsonValue,
          evidence: {
            key,
            evaluationMetric: result.metric,
            evaluationStatus: result.status,
            sourceType: result.sourceType,
            sourceId: result.sourceId,
            sourceGuid: result.sourceGuid,
          } as unknown as Prisma.InputJsonValue,
        },
      });
      existingKeys.add(key);
      created += 1;
    }

    return { created, skipped };
  }
}
