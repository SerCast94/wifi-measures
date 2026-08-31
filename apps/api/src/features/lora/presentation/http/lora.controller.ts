import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  InternalServerErrorException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  Res,
  ServiceUnavailableException,
} from "@nestjs/common";

import type { Response } from "express";
import { ApiTags } from "@nestjs/swagger";

import { MANAGE_MEASURES } from "@core/database/seeders/permissions/manage-measures.permissions";
import { HasPermissions } from "@features/auth/presentation/http/decorators/permissions.decorator";
import {
  LoraService,
  type CreateLoraAuditInput,
  type UpdateLoraAuditInput,
} from "@features/lora/application/lora.service";
import { LoraEvaluationService } from "@features/lora/application/lora-evaluation.service";
import { renderLoraPdf } from "@features/lora/application/lora-report";
import {
  CreateLoraAuditDto,
  CreateLoraMeasuresDto,
  CreateLoraNoiseDto,
  UpdateLoraAuditDto,
  UpdateLoraAuditStatusDto,
} from "./lora.dto";

@Controller("lora")
@ApiTags("LoRa")
export class LoraController {
  constructor(
    private readonly loraService: LoraService,
    private readonly evaluationService: LoraEvaluationService
  ) {}

  // ---------- Medidas ----------

  @Get("measures")
  @HttpCode(200)
  async listMeasures() {
    return this.loraService.listMeasures();
  }

  @Post("measures")
  @HttpCode(201)
  @HasPermissions([MANAGE_MEASURES], "any")
  async createMeasures(@Body() dto: CreateLoraMeasuresDto) {
    return this.loraService.createMeasures(dto.rows ?? []);
  }

  @Delete("measures")
  @HttpCode(200)
  @HasPermissions([MANAGE_MEASURES], "any")
  async clearMeasures() {
    return this.loraService.clearMeasures();
  }

  @Delete("measures/:id")
  @HttpCode(200)
  @HasPermissions([MANAGE_MEASURES], "any")
  async deleteMeasure(@Param("id", ParseIntPipe) id: number) {
    return this.loraService.deleteMeasure(id);
  }

  // ---------- Ruido ----------

  @Get("noise")
  @HttpCode(200)
  async listNoise() {
    return this.loraService.listNoise();
  }

  @Post("noise")
  @HttpCode(201)
  @HasPermissions([MANAGE_MEASURES], "any")
  async createNoise(@Body() dto: CreateLoraNoiseDto) {
    return this.loraService.createNoise(dto.rows ?? []);
  }

  @Delete("noise")
  @HttpCode(200)
  @HasPermissions([MANAGE_MEASURES], "any")
  async clearNoise() {
    return this.loraService.clearNoise();
  }

  @Delete("noise/:id")
  @HttpCode(200)
  @HasPermissions([MANAGE_MEASURES], "any")
  async deleteNoise(@Param("id", ParseIntPipe) id: number) {
    return this.loraService.deleteNoise(id);
  }

  // ---------- Auditorías ----------

  @Get("audits")
  @HttpCode(200)
  async listAudits(
    @Query("page") page?: string,
    @Query("size") size?: string,
    @Query("q") q?: string
  ) {
    return this.loraService.listAudits({
      page: page ? Number(page) : undefined,
      size: size ? Number(size) : undefined,
      q,
    });
  }

  @Post("audits")
  @HttpCode(201)
  @HasPermissions([MANAGE_MEASURES], "any")
  async createAudit(@Body() dto: CreateLoraAuditDto) {
    const { auditDate, startDate, endDate, ...rest } = dto;
    const input: CreateLoraAuditInput = {
      ...rest,
      auditDate: auditDate ? new Date(auditDate) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    };
    return this.loraService.createAudit(input);
  }

  @Get("audits/:id")
  @HttpCode(200)
  async getAuditById(@Param("id") id: string) {
    return this.loraService.getAuditByIdOrThrow(id);
  }

  @Patch("audits/:id")
  @HttpCode(200)
  @HasPermissions([MANAGE_MEASURES], "any")
  async updateAudit(@Param("id") id: string, @Body() dto: UpdateLoraAuditDto) {
    const { auditDate, startDate, endDate, ...rest } = dto;
    const input: UpdateLoraAuditInput = {
      ...(rest as UpdateLoraAuditInput),
      auditDate: auditDate ? new Date(auditDate) : null,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    };
    return this.loraService.updateAudit(id, input);
  }

  @Patch("audits/:id/status")
  @HttpCode(200)
  @HasPermissions([MANAGE_MEASURES], "any")
  async updateAuditStatus(
    @Param("id") id: string,
    @Body() dto: UpdateLoraAuditStatusDto
  ) {
    return this.loraService.updateAuditStatus(id, dto.status);
  }

  @Delete("audits/:id")
  @HttpCode(200)
  @HasPermissions([MANAGE_MEASURES], "any")
  async removeAudit(@Param("id") id: string) {
    return this.loraService.removeAudit(id);
  }

  // ---------- Análisis ----------

  @Post("audits/:id/analyze")
  @HttpCode(201)
  @HasPermissions([MANAGE_MEASURES], "any")
  async analyzeAudit(@Param("id") id: string) {
    return this.evaluationService.analyzeAudit(id);
  }

  @Get("audits/:id/analysis")
  @HttpCode(200)
  async getAnalysis(@Param("id") id: string) {
    return this.evaluationService.getAnalysis(id);
  }

  @Get("audits/:id/analysis-data")
  @HttpCode(200)
  async getAnalysisData(@Param("id") id: string) {
    return this.evaluationService.getAnalysisData(id);
  }

  // ---------- Informe ----------

  @Get("audits/:id/informe.pdf")
  async reportPdf(@Param("id") id: string, @Res() res: Response) {
    const audit = await this.loraService.getAuditByIdOrThrow(id);
    const analysis = await this.evaluationService.getAnalysis(id);
    const data = {
      header: {
        name: audit.name,
        code: audit.code,
        client: audit.client,
        project: audit.project,
        location: audit.location,
        technician: audit.technician,
        auditDate: audit.auditDate,
        objective: audit.objective,
        result: analysis?.summary.globalResult ?? null,
        hasAnalysis: analysis != null,
      },
      measures: audit.measure ? [audit.measure] : [],
      noise: audit.noise ? [audit.noise] : [],
    };
    let pdf: Buffer;
    try {
      pdf = await renderLoraPdf(data);
    } catch (error) {
      const code = error instanceof Error ? error.message : "";
      if (code === "PDF_NO_CHROMIUM" || code === "PDF_NO_ENGINE") {
        throw new ServiceUnavailableException(
          "Motor PDF no disponible en este entorno; usa «Imprimir / PDF» desde el informe."
        );
      }
      throw new InternalServerErrorException("No se pudo generar el PDF");
    }
    const filename = `informe-lora-${encodeURIComponent(audit.code || id)}.pdf`;
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
    res.end(pdf);
  }
}
