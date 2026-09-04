import {
  Body,
  Controller,
  HttpCode,
  HttpException,
  HttpStatus,
  Patch,
  Post,
} from "@nestjs/common";

import { ApiTags } from "@nestjs/swagger";

import { NetAllyService } from "@features/netally/application/netally.service";
import { HasPermissions } from "@features/auth/presentation/http/decorators/permissions.decorator";
import { MANAGE_MEASURES } from "@core/database/seeders/permissions/manage-measures.permissions";
import { UploadFloorPlanDto } from "./dto/upload-floor-plan.dto";
import { UpdateFloorPlanMeasurementsDto } from "./dto/update-floor-plan-measurements.dto";

@Controller("floorplans")
@ApiTags("FloorPlans")
export class FloorPlansController {
  constructor(private readonly netAllyService: NetAllyService) {}

  @Post("upload")
  @HttpCode(201)
  @HasPermissions([MANAGE_MEASURES], "any")
  async upload(@Body() dto: UploadFloorPlanDto) {
    const { imageBase64, ...metadata } = dto;
    const buffer = Buffer.from(imageBase64, "base64");
    if (buffer.length === 0) {
      throw new HttpException(
        "La imagen debe llegar en base64 válida",
        HttpStatus.BAD_REQUEST
      );
    }
    return this.netAllyService.createFloorPlan(buffer, {
      labels: metadata.labels,
      fileName: metadata.fileName,
      floorPlanName: metadata.floorPlanName,
      floorPlanWidthPx: metadata.floorPlanWidthPx,
      floorPlanHeightPx: metadata.floorPlanHeightPx,
      floorPlanScalePpf: metadata.floorPlanScalePpf,
      unit: metadata.unit,
      width: metadata.width,
      height: metadata.height,
    });
  }

  @Patch("measurements")
  @HttpCode(200)
  @HasPermissions([MANAGE_MEASURES], "any")
  async updateMeasurements(@Body() dto: UpdateFloorPlanMeasurementsDto) {
    return this.netAllyService.updateFloorPlanMeasurements(dto.linkLiveId, {
      floorPlanScalePpf: dto.floorPlanScalePpf,
      unit: dto.unit,
      width: dto.width,
      height: dto.height,
    });
  }
}
