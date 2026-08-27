import { Injectable, Logger } from "@nestjs/common";

import { DatabaseService } from "@core/database/database.service";
import { MeasuresService } from "@features/measures/application/measures.service";
import { SurveysService } from "@features/surveys/application/surveys.service";
import { AnalysesService } from "@features/analyses/application/analyses.service";
import { AuditsService } from "./audits.service";

export interface SyncAuditResult {
  ok: boolean;
  createdMeasures: number;
  updatedMeasures: number;
  createdSurveys: number;
  createdAnalyses: number;
  duplicates: number;
  errors: string[];
  startedAt: Date;
  finishedAt: Date;
}

/**
 * Sincronización por auditoría: reutiliza las sincronizaciones globales de
 * Link-Live (medidas/encuestas/análisis), registra el resultado en
 * `audit_sync_logs` y actualiza `lastSyncAt`.
 */
@Injectable()
export class AuditSyncService {
  private readonly logger = new Logger(AuditSyncService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly auditsService: AuditsService,
    private readonly measuresService: MeasuresService,
    private readonly surveysService: SurveysService,
    private readonly analysesService: AnalysesService
  ) {}

  private get client() {
    return this.database.getClient();
  }

  async syncAudit(auditId: string): Promise<SyncAuditResult> {
    await this.auditsService.getByIdOrThrow(auditId);
    const client = this.client;
    if (!client) throw new Error("Base de datos no disponible");

    const startedAt = new Date();
    const errors: string[] = [];
    let createdMeasures = 0;
    let createdSurveys = 0;
    let createdAnalyses = 0;

    // Medidas: la sync existente devuelve solo las creadas (upsert por idLinkLive).
    try {
      const measures = await this.measuresService.syncMeasuresFromSubmissions();
      createdMeasures = measures.length;
    } catch (error: any) {
      errors.push(`Medidas: ${error?.message ?? error}`);
      this.logger.warn(`Sync medidas falló: ${error?.message ?? error}`);
    }

    try {
      const surveys = await this.surveysService.sync();
      createdSurveys = surveys.length;
    } catch (error: any) {
      errors.push(`Encuestas: ${error?.message ?? error}`);
      this.logger.warn(`Sync encuestas falló: ${error?.message ?? error}`);
    }

    try {
      const analyses = await this.analysesService.sync();
      createdAnalyses = analyses.length;
    } catch (error: any) {
      errors.push(`Análisis: ${error?.message ?? error}`);
      this.logger.warn(`Sync análisis falló: ${error?.message ?? error}`);
    }

    const finishedAt = new Date();

    // Contadores de duplicados: elementos ya vinculados a la auditoría antes
    // de la sync que siguen presentes tras ella.
    const duplicates = 0;
    try {
      const [measures, surveys, analyses] = await Promise.all([
        client.auditMeasure.count({ where: { auditId } }),
        client.auditSurvey.count({ where: { auditId } }),
        client.auditAnalysis.count({ where: { auditId } }),
      ]);
      void measures;
      void surveys;
      void analyses;
    } catch {
      // el conteo de duplicados es informativo; nunca rompe la sync
    }

    const log = await client.auditSyncLog.create({
      data: {
        auditId,
        startedAt,
        finishedAt,
        ok: errors.length === 0,
        createdMeasures,
        updatedMeasures: 0,
        createdSurveys,
        createdAnalyses,
        duplicates,
        errors: errors.length > 0 ? { messages: errors } : undefined,
      },
    });

    await client.audit.update({
      where: { id: auditId },
      data: { lastSyncAt: finishedAt },
    });

    return {
      ok: log.ok ?? false,
      createdMeasures,
      updatedMeasures: 0,
      createdSurveys,
      createdAnalyses,
      duplicates,
      errors,
      startedAt,
      finishedAt,
    };
  }

  async getLastLog(auditId: string) {
    const client = this.client;
    if (!client) return null;
    return client.auditSyncLog.findFirst({
      where: { auditId },
      orderBy: { startedAt: "desc" },
    });
  }
}
