import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from "@nestjs/common";

import { ApiExtraModels, ApiTags } from "@nestjs/swagger";

import {
  CreateExteriorHeatmapDto,
  UpdateExteriorHeatmapDto,
} from "./dto/exterior-heatmap.dto";
import { ExteriorHeatmapPresenter } from "./exterior-heatmap.presenter";
import { ExteriorHeatmapService } from "../../application/exterior-heatmap.service";
import { ApiResponseType } from "@core/swagger/decorators/response.decorator";

@Controller("exterior-heatmaps")
@ApiTags("ExteriorHeatmaps")
@ApiExtraModels(ExteriorHeatmapPresenter)
export class ExteriorHeatmapsController {
  constructor(
    private readonly exteriorHeatmapService: ExteriorHeatmapService
  ) {}

  @Get("")
  @HttpCode(200)
  @ApiResponseType(ExteriorHeatmapPresenter, true)
  async getAll() {
    const items = await this.exteriorHeatmapService.getAll();
    return items.map((item) => new ExteriorHeatmapPresenter(item));
  }

  @Get("by-audit/:auditId")
  @HttpCode(200)
  @ApiResponseType(ExteriorHeatmapPresenter, true)
  async getByAudit(@Param("auditId") auditId: string) {
    const items = await this.exteriorHeatmapService.getByAudit(auditId);
    return items.map((item) => new ExteriorHeatmapPresenter(item));
  }

  @Get("by-lora-audit/:loraAuditId")
  @HttpCode(200)
  @ApiResponseType(ExteriorHeatmapPresenter, true)
  async getByLoraAudit(@Param("loraAuditId") loraAuditId: string) {
    const items = await this.exteriorHeatmapService.getByLoraAudit(loraAuditId);
    return items.map((item) => new ExteriorHeatmapPresenter(item));
  }

  @Get(":id")
  @HttpCode(200)
  @ApiResponseType(ExteriorHeatmapPresenter, false)
  async getById(@Param("id") id: string) {
    const item = await this.exteriorHeatmapService.getById(id);
    if (!item) return null;
    return new ExteriorHeatmapPresenter(item);
  }

  @Post("from-audit/:auditId")
  @HttpCode(201)
  @ApiResponseType(ExteriorHeatmapPresenter, false)
  async createFromAudit(@Param("auditId") auditId: string) {
    const item = await this.exteriorHeatmapService.createFromAudit(auditId);
    return new ExteriorHeatmapPresenter(item);
  }

  @Post("from-lora-audit/:loraAuditId")
  @HttpCode(201)
  @ApiResponseType(ExteriorHeatmapPresenter, false)
  async createFromLoraAudit(@Param("loraAuditId") loraAuditId: string) {
    const item =
      await this.exteriorHeatmapService.createFromLoraAudit(loraAuditId);
    return new ExteriorHeatmapPresenter(item);
  }

  @Post("")
  @HttpCode(201)
  @ApiResponseType(ExteriorHeatmapPresenter, false)
  async create(@Body() dto: CreateExteriorHeatmapDto) {
    const item = await this.exteriorHeatmapService.create(dto);
    return new ExteriorHeatmapPresenter(item);
  }

  @Patch(":id")
  @HttpCode(200)
  @ApiResponseType(ExteriorHeatmapPresenter, false)
  async update(@Param("id") id: string, @Body() dto: UpdateExteriorHeatmapDto) {
    const item = await this.exteriorHeatmapService.update(id, dto);
    if (!item) return null;
    return new ExteriorHeatmapPresenter(item);
  }

  @Delete(":id")
  @HttpCode(200)
  async remove(@Param("id") id: string) {
    return { deleted: await this.exteriorHeatmapService.remove(id) };
  }
}
