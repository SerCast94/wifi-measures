import { Controller, Get, HttpCode, Param, Post } from "@nestjs/common";

import { ApiExtraModels, ApiTags } from "@nestjs/swagger";

import { SurveyPresenter } from "./survey.presenter";
import { SurveysService } from "@features/surveys/application/surveys.service";
import {
  MANAGE_MEASURES,
  SYNC_MEASURES,
} from "@core/database/seeders/permissions/manage-measures.permissions";
import { ApiResponseType } from "@core/swagger/decorators/response.decorator";
import { HasPermissions } from "@features/auth/presentation/http/decorators/permissions.decorator";

@Controller("surveys")
@ApiTags("Surveys")
@ApiExtraModels(SurveyPresenter)
export class SurveysController {
  constructor(private readonly surveysService: SurveysService) {}

  @Get("")
  @HttpCode(200)
  @ApiResponseType(SurveyPresenter, true)
  async getAll() {
    const surveys = await this.surveysService.getAll();
    return surveys.map(
      (survey: any) =>
        new SurveyPresenter(survey, undefined, { includeImage: false })
    );
  }

  @Get(":id")
  @HttpCode(200)
  @ApiResponseType(SurveyPresenter, false)
  async getById(@Param("id") id: string) {
    const result = await this.surveysService.getById(id);
    if (!result) return null;
    return new SurveyPresenter(result.survey, result.points);
  }

  @Post("sync")
  @HttpCode(201)
  @ApiResponseType(SurveyPresenter, true)
  @HasPermissions([SYNC_MEASURES, MANAGE_MEASURES], "any")
  async sync() {
    const surveys = await this.surveysService.sync();
    return surveys.map(
      (survey: any) =>
        new SurveyPresenter(survey, undefined, { includeImage: false })
    );
  }

  @Post(":id/import-area/:areaId")
  @HttpCode(200)
  @ApiResponseType(SurveyPresenter, false)
  @HasPermissions([MANAGE_MEASURES], "any")
  async importToArea(@Param("id") id: string, @Param("areaId") areaId: string) {
    return this.surveysService.importToArea(id, areaId);
  }
}
