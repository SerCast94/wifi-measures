import { Injectable, NotFoundException } from "@nestjs/common";

import { Prisma } from "@prisma/client";

import { DatabaseService } from "@core/database/database.service";
import {
  EvaluationResult,
  RecommendationCategory,
} from "@features/audits/domain/entities/audit.types";

interface RecommendationRule {
  metric: string;
  statuses: Array<"FAIL" | "WARNING">;
  category: RecommendationCategory;
  text: string;
}

/**
 * Reglas de recomendaciones automáticas. El texto es orientativo y siempre
 * trazable a la evaluación que lo generó (campo `basis`).
 */
const RECOMMENDATION_RULES: RecommendationRule[] = [
  {
    metric: "RSSI",
    statuses: ["FAIL"],
    category: "INFRAESTRUCTURA",
    text: "Se recomienda revisar la ubicación o densidad de los puntos de acceso en las zonas donde la señal está por debajo del umbral definido.",
  },
  {
    metric: "RSSI",
    statuses: ["WARNING"],
    category: "OPTIMIZACION",
    text: "Vigilar las zonas con señal en el límite recomendado; un ajuste fino de potencia o posición de APs puede dar margen operativo.",
  },
  {
    metric: "SNR",
    statuses: ["FAIL"],
    category: "INFRAESTRUCTURA",
    text: "Se recomienda revisar las fuentes de interferencia y la planificación radioeléctrica para mejorar la relación señal/ruido.",
  },
  {
    metric: "CHANNEL_UTILIZATION",
    statuses: ["FAIL"],
    category: "OPTIMIZACION",
    text: "Se recomienda revisar la distribución de canales y la densidad de dispositivos; hay canales con utilización por encima del umbral.",
  },
  {
    metric: "CHANNEL_UTILIZATION",
    statuses: ["WARNING"],
    category: "OPTIMIZACION",
    text: "Planificar una redistribución de canales para reducir la utilización antes de que afecte al rendimiento percibido.",
  },
  {
    metric: "NON_WIFI_UTILIZATION",
    statuses: ["FAIL"],
    category: "OPTIMIZACION",
    text: "Identificar y valorar las fuentes de ocupación espectral no Wi-Fi detectadas (Bluetooth, vídeo, microondas u otros sistemas).",
  },
  {
    metric: "CO_CHANNEL_INTERFERENCE",
    statuses: ["FAIL", "WARNING"],
    category: "OPTIMIZACION",
    text: "Revisar la asignación de canales para reducir el solapamiento co-canal entre puntos de acceso.",
  },
  {
    metric: "ADJACENT_CHANNEL_INTERFERENCE",
    statuses: ["FAIL"],
    category: "OPTIMIZACION",
    text: "Reasignar los canales adyacentes con solapamiento espectral apreciable.",
  },
  {
    metric: "ROGUE_APS",
    statuses: ["FAIL", "WARNING"],
    category: "INMEDIATA",
    text: "Auditar los puntos de acceso detectados como no autorizados y confirmar si deben aislarse o integrarse en la red gestionada.",
  },
  {
    metric: "ASSOCIATION",
    statuses: ["FAIL"],
    category: "INMEDIATA",
    text: "Repetir la prueba de asociación verificando SSID, credenciales y seguridad configurada en el punto afectado.",
  },
  {
    metric: "DHCP",
    statuses: ["FAIL"],
    category: "INMEDIATA",
    text: "Verificar el servicio DHCP y la configuración de VLANs de la SSID afectada.",
  },
  {
    metric: "GATEWAY",
    statuses: ["FAIL"],
    category: "INMEDIATA",
    text: "Comprobar la pasarela por defecto y el encaminamiento desde la red inalámbrica hacia la LAN.",
  },
  {
    metric: "DNS",
    statuses: ["FAIL"],
    category: "INMEDIATA",
    text: "Revisar los servidores DNS entregados por DHCP y su accesibilidad desde la red inalámbrica.",
  },
  {
    metric: "INTERNET",
    statuses: ["FAIL"],
    category: "INMEDIATA",
    text: "Validar la salida a Internet (firewall/proxy) desde la SSID auditada.",
  },
  {
    metric: "HTTP_HTTPS",
    statuses: ["FAIL"],
    category: "INMEDIATA",
    text: "Comprobar filtros, proxy o autenticación cautiva que puedan bloquear el tráfico HTTP/HTTPS.",
  },
  {
    metric: "COVERAGE_PASS_RATE",
    statuses: ["FAIL"],
    category: "INFRAESTRUCTURA",
    text: "Ampliar o ajustar la cobertura en las zonas del mapa de calor por debajo del objetivo (nuevos APs o cambio de ubicación).",
  },
];

@Injectable()
export class AuditRecommendationService {
  constructor(private readonly database: DatabaseService) {}

  private get client() {
    return this.database.getClient();
  }

  async list(auditId: string) {
    const client = this.client;
    if (!client) return [];
    return client.auditRecommendation.findMany({
      where: { auditId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }],
    });
  }

  async createManual(
    auditId: string,
    input: { text: string; category?: RecommendationCategory }
  ) {
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    const maxOrder = await client.auditRecommendation.aggregate({
      where: { auditId },
      _max: { sortOrder: true },
    });
    return client.auditRecommendation.create({
      data: {
        auditId,
        origin: "MANUAL",
        category: input.category ?? "INMEDIATA",
        text: input.text,
        sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
      },
    });
  }

  async update(
    auditId: string,
    recommendationId: string,
    input: Partial<{ text: string; category: RecommendationCategory; accepted: boolean }>
  ) {
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    const recommendation = await client.auditRecommendation.findFirst({
      where: { id: recommendationId, auditId },
    });
    if (!recommendation) throw new NotFoundException("Recomendación no encontrada");
    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(input)) {
      if (value !== undefined) data[key] = value;
    }
    return client.auditRecommendation.update({ where: { id: recommendationId }, data });
  }

  async remove(auditId: string, recommendationId: string) {
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    const recommendation = await client.auditRecommendation.findFirst({
      where: { id: recommendationId, auditId },
    });
    if (!recommendation) throw new NotFoundException("Recomendación no encontrada");
    await client.auditRecommendation.delete({ where: { id: recommendationId } });
    return { ok: true };
  }

  /**
   * Regenera las recomendaciones automáticas. Las manuales y las automáticas
   * aceptadas/editadas se conservan.
   */
  async generateFromEvaluations(auditId: string, results: EvaluationResult[]) {
    const client = this.client;
    if (!client) return { created: 0 };

    // Conserva manuales + automáticas ya aceptadas; elimina automáticas sin decisión.
    await client.auditRecommendation.deleteMany({
      where: { auditId, origin: "AUTO", accepted: null },
    });

    let created = 0;
    let order = await client.auditRecommendation.count({ where: { auditId } });
    const seenTexts = new Set<string>(
      (
        await client.auditRecommendation.findMany({
          where: { auditId },
          select: { text: true },
        })
      ).map((row: any) => row.text)
    );

    for (const result of results) {
      const rule = RECOMMENDATION_RULES.find(
        (candidate) =>
          candidate.metric === result.metric &&
          candidate.statuses.includes(result.status as "FAIL" | "WARNING")
      );
      if (!rule || seenTexts.has(rule.text)) continue;

      await client.auditRecommendation.create({
        data: {
          auditId,
          origin: "AUTO",
          category: rule.category,
          text: rule.text,
          basis: {
            evaluationMetric: result.metric,
            evaluationStatus: result.status,
            value: result.value,
            unit: result.unit,
            threshold: result.threshold ?? null,
            sourceType: result.sourceType,
            sourceGuid: result.sourceGuid,
            locationLabel: result.locationLabel ?? null,
          } as unknown as Prisma.InputJsonValue,
          sortOrder: ++order,
        },
      });
      seenTexts.add(rule.text);
      created += 1;
    }

    return { created };
  }
}
