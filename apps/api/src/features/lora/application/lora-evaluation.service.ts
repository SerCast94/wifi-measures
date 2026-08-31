import { Injectable } from "@nestjs/common";

import { DatabaseService } from "@core/database/database.service";
import { LoraService } from "./lora.service";
import {
  analyzeLora,
  type AnalysisSummary,
  type CoherenceResult,
  type EvaluatedMetric,
  summarizeAnalysis,
} from "./lora-analysis-lib";

export interface LoraAnalysisResult {
  batchId: string;
  runAt: Date;
  evaluations: EvaluatedMetric[];
  summary: AnalysisSummary;
  coherence: CoherenceResult[];
}

@Injectable()
export class LoraEvaluationService {
  constructor(
    private readonly database: DatabaseService,
    private readonly loraService: LoraService
  ) {}

  private get client() {
    return this.database.getClient();
  }

  private parseBlocks(value: unknown): Array<Record<string, any>> {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is Record<string, any> =>
      Boolean(item && typeof item === "object")
    );
  }

  private parseNoiseEntries(value: unknown): Array<Record<string, any>> {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is Record<string, any> =>
      Boolean(item && typeof item === "object")
    );
  }

  /**
   * Ejecuta el análisis sobre la medida y el ruido vinculados a la auditoría
   * y persiste los resultados, sustituyendo el lote anterior.
   */
  async analyzeAudit(auditId: string): Promise<LoraAnalysisResult> {
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");

    const audit = await this.loraService.getAuditByIdOrThrow(auditId);
    const blocks = this.parseBlocks(audit.measure?.blocks);
    const noiseEntries = this.parseNoiseEntries(audit.noise?.entries);

    const { evaluations, coherence } = analyzeLora(blocks, noiseEntries);
    const summary = summarizeAnalysis(evaluations);

    const batchId = `lora-run-${Date.now()}`;
    const runAt = new Date();
    await client.loraAnalysis.deleteMany({ where: { auditId } });
    if (evaluations.length > 0) {
      await client.loraAnalysis.createMany({
        data: evaluations.map((e) => ({
          auditId,
          category: e.category,
          metric: e.metric,
          blockRole: null,
          value: e.value,
          unit: e.unit,
          status: e.status,
          label: e.label,
          message: e.message,
          runAt,
        })),
      });
    }

    return { batchId, runAt, evaluations, summary, coherence };
  }

  /** Devuelve el último análisis persistiendo (o uno vacío si no se analizó). */
  async getAnalysis(auditId: string): Promise<LoraAnalysisResult | null> {
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");

    const audit = await this.loraService.getAuditByIdOrThrow(auditId);
    const rows: Array<{
      id: string;
      category: string;
      metric: string;
      value: number | null;
      unit: string | null;
      status: string;
      label: string | null;
      message: string | null;
      runAt: Date;
    }> = await client.loraAnalysis.findMany({
      where: { auditId },
      orderBy: [{ runAt: "desc" }, { id: "asc" }],
    });
    if (rows.length === 0) return null;

    const runAt = rows[0].runAt;
    const evaluations = rows.map(
      (row): EvaluatedMetric => ({
        category: row.category,
        metric: row.metric,
        value: row.value,
        unit: row.unit,
        status: (row.status as EvaluatedMetric["status"]) ?? "UNKNOWN",
        label: row.label,
        message: row.message ?? "",
      })
    );
    const blocks = this.parseBlocks(audit.measure?.blocks);
    const noiseEntries = this.parseNoiseEntries(audit.noise?.entries);
    const { coherence } = analyzeLora(blocks, noiseEntries);

    return {
      batchId: `lora-run-${runAt.getTime()}`,
      runAt,
      evaluations,
      summary: summarizeAnalysis(evaluations),
      coherence,
    };
  }

  /** Datos para gráficas (señal, pérdidas, ruido) derivados de la auditoría. */
  async getAnalysisData(auditId: string) {
    const audit = await this.loraService.getAuditByIdOrThrow(auditId);
    const blocks = this.parseBlocks(audit.measure?.blocks);
    const noiseEntries = this.parseNoiseEntries(audit.noise?.entries);

    return {
      blocks: blocks.map((b) => ({
        role: b.role ?? null,
        rssi: b.rssi ?? null,
        snr: b.snr ?? null,
        packetLossPct: b.packetLossPct ?? null,
        totalPackets: b.totalPackets ?? null,
      })),
      noise: noiseEntries.map((e) => ({
        frequency: e.frequency ?? null,
        currentScan: e.currentScan ?? null,
        weightedAverageScan: e.weightedAverageScan ?? null,
      })),
    };
  }

  async clearAnalysis(auditId: string) {
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");
    await client.loraAnalysis.deleteMany({ where: { auditId } });
    return { ok: true };
  }
}
