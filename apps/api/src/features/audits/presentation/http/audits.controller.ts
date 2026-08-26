import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  InternalServerErrorException,
  Param,
  Patch,
  Post,
  Put,
  Query,
  Res,
  ServiceUnavailableException,
} from "@nestjs/common";

import type { Response } from "express";

import { ApiTags } from "@nestjs/swagger";

import {
  MANAGE_MEASURES,
  SYNC_MEASURES,
} from "@core/database/seeders/permissions/manage-measures.permissions";
import { HasPermissions } from "@features/auth/presentation/http/decorators/permissions.decorator";
import { AuditsService } from "@features/audits/application/audits.service";
import { AuditEvaluationService } from "@features/audits/application/audit-evaluation.service";
import { AuditIssueService } from "@features/audits/application/audit-issue.service";
import { AuditRecommendationService } from "@features/audits/application/audit-recommendation.service";
import { AuditSyncService } from "@features/audits/application/audit-sync.service";
import { AuditDataQualityService } from "@features/audits/application/audit-data-quality.service";
import {
  AuditReportService,
  ReportSection,
} from "@features/audits/application/audit-report.service";
import {
  renderPdf,
  renderReportHtml,
} from "@features/audits/application/report-pdf";
import {
  AddManualTestDto,
  AddMembersDto,
  CreateAuditDto,
  CreateIssueDto,
  CreateRecommendationDto,
  SaveReportDto,
  SetFloorsDto,
  UpdateAuditDto,
  UpdateConclusionDto,
  UpdateIssueDto,
  UpdateMemberDto,
  UpdateProfileDto,
  UpdateRecommendationDto,
  UpdateStatusDto,
  UpdateTestDto,
} from "./audits.dto";

@Controller("audits")
@ApiTags("Audits")
export class AuditsController {
  constructor(
    private readonly auditsService: AuditsService,
    private readonly evaluationService: AuditEvaluationService,
    private readonly issueService: AuditIssueService,
    private readonly recommendationService: AuditRecommendationService,
    private readonly syncService: AuditSyncService,
    private readonly dataQualityService: AuditDataQualityService,
    private readonly reportService: AuditReportService
  ) {}

  // ---------- Perfiles ----------
  @Get("profiles")
  @HttpCode(200)
  async profiles() {
    return this.auditsService.listProfiles();
  }

  /** Personaliza la plantilla de checklist del perfil (ítems extra). */
  @Put("profiles/:profileId")
  @HasPermissions([MANAGE_MEASURES], "any")
  async updateProfile(
    @Param("profileId") profileId: string,
    @Body() dto: UpdateProfileDto
  ) {
    return this.auditsService.updateProfile(profileId, dto);
  }

  /** Métricas globales para el dashboard de inicio. */
  @Get("stats")
  @HttpCode(200)
  async stats() {
    return this.auditsService.getStats();
  }

  /** Comparativa de resultados entre auditorías recientes. */
  @Get("comparativa")
  @HttpCode(200)
  async comparativa() {
    return this.auditsService.getComparison();
  }

  // ---------- CRUD ----------
  @Get("")
  @HttpCode(200)
  async list(
    @Query("page") page?: string,
    @Query("size") size?: string,
    @Query("q") q?: string,
    @Query("status") status?: string
  ) {
    return this.auditsService.list({
      page: page ? Number(page) : undefined,
      size: size ? Number(size) : undefined,
      q,
      status,
    });
  }

  @Post("")
  @HttpCode(201)
  @HasPermissions([MANAGE_MEASURES], "any")
  async create(@Body() dto: CreateAuditDto) {
    const { auditDate, startDate, endDate, ...rest } = dto;
    return this.auditsService.create({
      ...rest,
      auditDate: auditDate ? new Date(auditDate) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    });
  }

  @Get(":id")
  @HttpCode(200)
  async getById(@Param("id") id: string) {
    return this.auditsService.getByIdOrThrow(id);
  }

  @Put(":id")
  @HttpCode(200)
  @HasPermissions([MANAGE_MEASURES], "any")
  async update(@Param("id") id: string, @Body() dto: UpdateAuditDto) {
    const { auditDate, startDate, endDate, ...rest } = dto;
    return this.auditsService.update(id, {
      ...rest,
      auditDate: auditDate ? new Date(auditDate) : auditDate === null ? null : undefined,
      startDate: startDate ? new Date(startDate) : startDate === null ? null : undefined,
      endDate: endDate ? new Date(endDate) : endDate === null ? null : undefined,
    });
  }

  @Patch(":id/status")
  @HttpCode(200)
  @HasPermissions([MANAGE_MEASURES], "any")
  async updateStatus(@Param("id") id: string, @Body() dto: UpdateStatusDto) {
    return this.auditsService.updateStatus(
      id,
      dto.status as Parameters<AuditsService["updateStatus"]>[1]
    );
  }

  @Delete(":id")
  @HttpCode(200)
  @HasPermissions([MANAGE_MEASURES], "any")
  async remove(@Param("id") id: string) {
    return this.auditsService.remove(id);
  }

  // ---------- Dashboard ----------
  @Get(":id/dashboard")
  @HttpCode(200)
  async dashboard(@Param("id") id: string) {
    return this.auditsService.getDashboard(id);
  }

  // ---------- Checklist ----------
  @Get(":id/tests")
  @HttpCode(200)
  async listTests(@Param("id") id: string) {
    await this.auditsService.getByIdOrThrow(id);
    const client = this.databaseClient();
    if (!client) return [];
    return client.auditTest.findMany({ where: { auditId: id }, orderBy: { sortOrder: "asc" } });
  }

  @Post(":id/tests")
  @HttpCode(201)
  @HasPermissions([MANAGE_MEASURES], "any")
  async addTest(@Param("id") id: string, @Body() dto: AddManualTestDto) {
    return this.auditsService.addManualTest(id, dto);
  }

  @Patch(":id/tests/:testId")
  @HttpCode(200)
  @HasPermissions([MANAGE_MEASURES], "any")
  async updateTest(
    @Param("id") id: string,
    @Param("testId") testId: string,
    @Body() dto: UpdateTestDto
  ) {
    return this.auditsService.updateTest(id, testId, dto);
  }

  @Delete(":id/tests/:testId")
  @HttpCode(200)
  @HasPermissions([MANAGE_MEASURES], "any")
  async deleteTest(@Param("id") id: string, @Param("testId") testId: string) {
    return this.auditsService.deleteTest(id, testId);
  }

  // ---------- Sincronización ----------
  @Post(":id/sync")
  @HttpCode(200)
  @HasPermissions([SYNC_MEASURES, MANAGE_MEASURES], "any")
  async sync(@Param("id") id: string) {
    return this.syncService.syncAudit(id);
  }

  @Get(":id/sync-logs")
  @HttpCode(200)
  async syncLogs(@Param("id") id: string) {
    return this.syncService.getLastLog(id);
  }

  // ---------- Miembros y candidatos ----------
  @Get(":id/members")
  @HttpCode(200)
  async members(@Param("id") id: string) {
    return this.auditsService.getMembers(id);
  }

  @Get(":id/candidates")
  @HttpCode(200)
  async candidates(
    @Param("id") id: string,
    @Query("type") type?: string,
    @Query("page") page?: string,
    @Query("size") size?: string
  ) {
    const all = await this.auditsService.getCandidates(id, {
      page: page ? Number(page) : undefined,
      size: size ? Number(size) : undefined,
    });
    if (type === "measure") return all.measures;
    if (type === "survey") return all.surveys;
    if (type === "analysis") return all.analyses;
    return all;
  }

  @Post(":id/members")
  @HttpCode(200)
  @HasPermissions([MANAGE_MEASURES], "any")
  async addMembers(@Param("id") id: string, @Body() dto: AddMembersDto) {
    const ids = dto.ids.map((value) => String(value));
    if (dto.type === "measure") return this.auditsService.addMeasures(id, ids);
    if (dto.type === "survey")
      return this.auditsService.addSurveys(id, ids.map(Number), dto.floorId ?? null);
    return this.auditsService.addAnalyses(id, ids.map(Number));
  }

  @Delete(":id/members/:type/:memberId")
  @HttpCode(200)
  @HasPermissions([MANAGE_MEASURES], "any")
  async removeMember(
    @Param("id") id: string,
    @Param("type") type: "measure" | "survey" | "analysis",
    @Param("memberId") memberId: string
  ) {
    if (type === "survey") return this.auditsService.removeSurvey(id, Number(memberId));
    if (type === "analysis") return this.auditsService.removeAnalysis(id, Number(memberId));
    return this.auditsService.removeMeasure(id, memberId);
  }

  /** Actualiza metadatos de un miembro (planta asignada, etiqueta). */
  @Patch(":id/members/:type/:memberId")
  @HasPermissions([MANAGE_MEASURES], "any")
  async updateMember(
    @Param("id") id: string,
    @Param("type") type: "measure" | "survey" | "analysis",
    @Param("memberId") memberId: string,
    @Body() dto: UpdateMemberDto
  ) {
    return this.auditsService.updateMember(id, type, memberId, dto);
  }

  @Put(":id/floors")
  @HttpCode(200)
  @HasPermissions([MANAGE_MEASURES], "any")
  async setFloors(@Param("id") id: string, @Body() dto: SetFloorsDto) {
    return this.auditsService.update(id, { floorNames: dto.names });
  }

  // ---------- Motor de evaluación ----------
  @Post(":id/evaluate")
  @HttpCode(200)
  @HasPermissions([MANAGE_MEASURES, SYNC_MEASURES], "any")
  async evaluate(@Param("id") id: string) {
    return this.evaluationService.evaluateAudit(id);
  }

  @Get(":id/evaluations")
  @HttpCode(200)
  async evaluations(@Param("id") id: string) {
    await this.auditsService.getByIdOrThrow(id);
    const client = this.databaseClient();
    if (!client) return [];
    return client.auditEvaluation.findMany({
      where: { auditId: id },
      orderBy: [{ category: "asc" }, { metric: "asc" }],
    });
  }

  // ---------- Incidencias ----------
  @Get(":id/issues")
  @HttpCode(200)
  async issues(@Param("id") id: string) {
    return this.issueService.list(id);
  }

  @Post(":id/issues")
  @HttpCode(201)
  @HasPermissions([MANAGE_MEASURES], "any")
  async createIssue(@Param("id") id: string, @Body() dto: CreateIssueDto) {
    return this.issueService.createManual(id, dto as never);
  }

  @Patch(":id/issues/:issueId")
  @HttpCode(200)
  @HasPermissions([MANAGE_MEASURES], "any")
  async updateIssue(
    @Param("id") id: string,
    @Param("issueId") issueId: string,
    @Body() dto: UpdateIssueDto
  ) {
    return this.issueService.update(id, issueId, dto as never);
  }

  @Delete(":id/issues/:issueId")
  @HttpCode(200)
  @HasPermissions([MANAGE_MEASURES], "any")
  async removeIssue(@Param("id") id: string, @Param("issueId") issueId: string) {
    return this.issueService.remove(id, issueId);
  }

  // ---------- Recomendaciones ----------
  @Get(":id/recommendations")
  @HttpCode(200)
  async recommendations(@Param("id") id: string) {
    return this.recommendationService.list(id);
  }

  @Post(":id/recommendations")
  @HttpCode(201)
  @HasPermissions([MANAGE_MEASURES], "any")
  async createRecommendation(
    @Param("id") id: string,
    @Body() dto: CreateRecommendationDto
  ) {
    return this.recommendationService.createManual(id, dto as never);
  }

  @Patch(":id/recommendations/:recommendationId")
  @HttpCode(200)
  @HasPermissions([MANAGE_MEASURES], "any")
  async updateRecommendation(
    @Param("id") id: string,
    @Param("recommendationId") recommendationId: string,
    @Body() dto: UpdateRecommendationDto
  ) {
    return this.recommendationService.update(id, recommendationId, dto as never);
  }

  @Delete(":id/recommendations/:recommendationId")
  @HttpCode(200)
  @HasPermissions([MANAGE_MEASURES], "any")
  async removeRecommendation(
    @Param("id") id: string,
    @Param("recommendationId") recommendationId: string
  ) {
    return this.recommendationService.remove(id, recommendationId);
  }

  // ---------- Conclusiones ----------
  @Get(":id/conclusion")
  @HttpCode(200)
  async conclusion(@Param("id") id: string) {
    return this.reportService.getConclusion(id);
  }

  @Put(":id/conclusion")
  @HttpCode(200)
  @HasPermissions([MANAGE_MEASURES], "any")
  async updateConclusion(
    @Param("id") id: string,
    @Body() dto: UpdateConclusionDto
  ) {
    return this.reportService.updateConclusion(id, dto);
  }

  // ---------- Calidad de datos ----------
  @Get(":id/data-quality")
  @HttpCode(200)
  async dataQuality(@Param("id") id: string) {
    return this.dataQualityService.check(id);
  }

  /** Reemplaza los anexos (adjuntos Link-Live) de la auditoría. */
  @Put(":id/anexos")
  @HasPermissions([MANAGE_MEASURES], "any")
  async setAnexos(
    @Param("id") id: string,
    @Body() dto: { items: Array<{ name: string; href: string }> }
  ) {
    return this.auditsService.setAnexos(id, dto.items ?? []);
  }

  // ---------- Informe ----------
  @Get(":id/report-data")
  @HttpCode(200)
  async reportData(
    @Param("id") id: string,
    @Query("sections") sections?: string
  ) {
    const sectionList = sections
      ? (sections.split(",").map((s) => s.trim()) as ReportSection[])
      : undefined;
    return this.reportService.buildReportData(id, sectionList);
  }

  @Get(":id/reports")
  @HttpCode(200)
  async reportVersions(@Param("id") id: string) {
    return this.reportService.listVersions(id);
  }

  /** PDF real (headless Chromium) con numeración física de páginas. */
  @Get(":id/informe.pdf")
  async reportPdf(@Param("id") id: string, @Res() res: Response) {
    const data = await this.reportService.buildReportData(id);
    const html = renderReportHtml(data);
    let pdf: Buffer;
    try {
      pdf = await renderPdf(html);
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      if (code === "PDF_NO_CHROMIUM" || code === "PDF_NO_ENGINE") {
        throw new ServiceUnavailableException(
          "Motor PDF no disponible en este entorno; usa «Imprimir / PDF» desde el informe."
        );
      }
      throw new InternalServerErrorException("No se pudo generar el PDF");
    }
    const filename = `informe-${encodeURIComponent(data.header?.code || id)}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.end(pdf);
  }

  @Post(":id/reports")
  @HttpCode(201)
  @HasPermissions([MANAGE_MEASURES], "any")
  async saveReportVersion(@Param("id") id: string, @Body() dto: SaveReportDto) {
    return this.reportService.saveVersion(id, {
      sections: dto.sections as ReportSection[],
    });
  }

  private databaseClient() {
    // Acceso directo a Prisma para lecturas simples del propio módulo.
    return this.auditsService["client"];
  }
}
