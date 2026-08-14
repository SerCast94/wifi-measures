import { Controller, Get, HttpCode, Param, Query } from "@nestjs/common";

import { ApiExtraModels, ApiTags } from "@nestjs/swagger";

import { AreaImagesPresenter } from "./area-images.presenter";
import { ApiResponseType } from "@core/swagger/decorators/response.decorator";
import { MeasuresService } from "@features/measures/application/measures.service";
import { MeasureImagesPresenter } from "./measure-images.presenter";

@Controller("areas")
@ApiTags("Areas")
@ApiExtraModels(AreaImagesPresenter)
export class AreasController {
  constructor(private readonly measuresService: MeasuresService) {}

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
}
