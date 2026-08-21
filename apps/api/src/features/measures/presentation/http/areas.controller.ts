import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Put,
  Query,
} from "@nestjs/common";

import { ApiExtraModels, ApiTags } from "@nestjs/swagger";

import { UpsertAreaPlanDto } from "./dto/upsert-area-plan.dto";
import { AreaImagesPresenter } from "./area-images.presenter";
import { ApiResponseType } from "@core/swagger/decorators/response.decorator";
import { MeasuresService } from "@features/measures/application/measures.service";
import { MeasureImagesPresenter } from "./measure-images.presenter";
import { AreaPlanService } from "@features/measures/application/area-plan.service";

@Controller("areas")
@ApiTags("Areas")
@ApiExtraModels(AreaImagesPresenter, MeasureImagesPresenter)
export class AreasController {
  constructor(
    private readonly measuresService: MeasuresService,
    private readonly areaPlanService: AreaPlanService
  ) {}

  @Get(":id/fotoAnthems")
  @HttpCode(200)
  @ApiResponseType(AreaImagesPresenter, true)
  async getAnthemsImages(@Param("id") areaId: string) {
    const areaAnthemsImages =
      await this.measuresService.getAreaAnthemsImages(areaId);

    return areaAnthemsImages.map((image) => new AreaImagesPresenter(image));
  }

  @Get(":id/images")
  @HttpCode(200)
  @ApiResponseType(MeasureImagesPresenter, true)
  async getImages(
    @Param("id") areaId: string,
    @Query("original") original?: boolean
  ) {
    const areaImages = await this.measuresService.getAreaImages(
      areaId,
      original
    );

    return areaImages.map((image) => new MeasureImagesPresenter(image));
  }

  @Get(":id/plan")
  @HttpCode(200)
  async getPlan(@Param("id") areaId: string) {
    return this.areaPlanService.getByAreaId(+areaId);
  }

  @Put(":id/plan")
  @HttpCode(200)
  async upsertPlan(
    @Param("id") areaId: string,
    @Body() dto: UpsertAreaPlanDto
  ) {
    return this.areaPlanService.upsert(+areaId, dto);
  }
}
