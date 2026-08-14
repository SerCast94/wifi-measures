import { Controller, Get, HttpCode, Param, Post, Query } from "@nestjs/common";

import { ApiExtraModels, ApiTags } from "@nestjs/swagger";

import { MeasurePresenter } from "./measure.presenter";
import { MeasureImagesPresenter } from "./measure-images.presenter";
import {
  MANAGE_MEASURES,
  SYNC_MEASURES,
} from "@core/database/seeders/permissions/manage-measures.permissions";
import { ApiResponseType } from "@core/swagger/decorators/response.decorator";
import { MeasuresService } from "@features/measures/application/measures.service";
import { HasPermissions } from "@features/auth/presentation/http/decorators/permissions.decorator";

@Controller("measures")
@ApiTags("Measures")
@ApiExtraModels(MeasurePresenter)
export class MeasuresController {
  constructor(private readonly measuresService: MeasuresService) {}

  @Get("")
  @HttpCode(200)
  @ApiResponseType(MeasurePresenter, true)
  async getAll() {
    const measures = await this.measuresService.getAll();

    return measures.map((measure) => new MeasurePresenter(measure));
  }

  @Get(":id/images")
  @HttpCode(200)
  @ApiResponseType(MeasureImagesPresenter, false)
  async getImages(
    @Param("id") id: string,
    @Query("original") original?: boolean
  ) {
    const images = await this.measuresService.getImages(id, original);

    return new MeasureImagesPresenter(images);
  }

  @Post("sync")
  @HttpCode(201)
  @ApiResponseType(MeasurePresenter, true)
  @HasPermissions([SYNC_MEASURES, MANAGE_MEASURES], "any")
  async sync() {
    const submissions =
      await this.measuresService.syncMeasuresFromSubmissions();

    return submissions.map((measure) => new MeasurePresenter(measure));
  }
}
