import {
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from "@nestjs/common";

import { ApiExtraModels, ApiTags } from "@nestjs/swagger";

import { AnalysisPresenter, AnalysisHostPresenter } from "./analysis.presenter";
import { AnalysesService } from "@features/analyses/application/analyses.service";
import {
  MANAGE_MEASURES,
  SYNC_MEASURES,
} from "@core/database/seeders/permissions/manage-measures.permissions";
import { ApiResponseType } from "@core/swagger/decorators/response.decorator";
import { HasPermissions } from "@features/auth/presentation/http/decorators/permissions.decorator";

@Controller("analyses")
@ApiTags("Analyses")
@ApiExtraModels(AnalysisPresenter, AnalysisHostPresenter)
export class AnalysesController {
  constructor(private readonly analysesService: AnalysesService) {}

  @Get("")
  @HttpCode(200)
  @ApiResponseType(AnalysisPresenter, true)
  async getAll() {
    const analyses = await this.analysesService.getAll();
    return analyses.map((analysis: any) => new AnalysisPresenter(analysis));
  }

  @Get(":id")
  @HttpCode(200)
  @ApiResponseType(AnalysisPresenter, false)
  async getById(@Param("id") id: string) {
    const result = await this.analysesService.getById(id);
    if (!result) return null;
    return new AnalysisPresenter(result.analysis, {
      hostCounts: result.hostCounts,
    });
  }

  @Get(":id/hosts")
  @HttpCode(200)
  @ApiResponseType(AnalysisHostPresenter, true)
  async getHosts(@Param("id") id: string, @Query("type") type?: string) {
    const hosts = await this.analysesService.getHosts(id, type);
    return hosts.map((host: any) => new AnalysisHostPresenter(host));
  }

  @Post("sync")
  @HttpCode(201)
  @ApiResponseType(AnalysisPresenter, true)
  @HasPermissions([SYNC_MEASURES, MANAGE_MEASURES], "any")
  async sync() {
    const analyses = await this.analysesService.sync();
    return analyses.map((analysis: any) => new AnalysisPresenter(analysis));
  }

  @Delete(":id")
  @HttpCode(200)
  @HasPermissions([MANAGE_MEASURES], "any")
  async remove(@Param("id") id: string) {
    return this.analysesService.delete(id);
  }
}
