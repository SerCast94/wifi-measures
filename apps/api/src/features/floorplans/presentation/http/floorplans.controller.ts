import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";

import { ApiExtraModels, ApiTags } from "@nestjs/swagger";

import { FloorPlanPresenter } from "./floorplan.presenter";
import { CreateFloorPlanDto, UpdateFloorPlanDto } from "./dto/floorplan.dto";
import { FloorPlanService } from "../../application/floorplan.service";
import { ApiResponseType } from "@core/swagger/decorators/response.decorator";
import { LinkLiveService } from "@core/linklive/linklive.service";

@Controller("floorplans")
@ApiTags("FloorPlans")
@ApiExtraModels(FloorPlanPresenter)
export class FloorPlansController {
  constructor(
    private readonly floorPlanService: FloorPlanService,
    private readonly linkLive: LinkLiveService
  ) {}

  @Get("")
  @HttpCode(200)
  @ApiResponseType(FloorPlanPresenter, true)
  async getAll(@Query("minimal") minimal?: string) {
    const plans = await this.floorPlanService.getAll();
    const includeImage = minimal !== "true";
    return plans.map(
      (plan) => new FloorPlanPresenter(plan, { includeImage })
    );
  }

  @Get(":id")
  @HttpCode(200)
  @ApiResponseType(FloorPlanPresenter, false)
  async getById(@Param("id") id: string) {
    const plan = await this.floorPlanService.getById(Number(id));
    if (!plan) return null;
    return new FloorPlanPresenter(plan, { includeImage: true });
  }

  @Post("")
  @HttpCode(201)
  @ApiResponseType(FloorPlanPresenter, false)
  async create(@Body() dto: CreateFloorPlanDto) {
    const plan = await this.floorPlanService.create(dto);
    if (!plan) return null;
    return new FloorPlanPresenter(plan, { includeImage: true });
  }

  @Patch(":id")
  @HttpCode(200)
  @ApiResponseType(FloorPlanPresenter, false)
  async update(@Param("id") id: string, @Body() dto: UpdateFloorPlanDto) {
    const plan = await this.floorPlanService.update(Number(id), dto);
    if (!plan) return null;
    return new FloorPlanPresenter(plan, { includeImage: true });
  }

  @Delete(":id")
  @HttpCode(200)
  async remove(@Param("id") id: string) {
    const plan = await this.floorPlanService.getById(Number(id));
    if (plan && plan.linkLiveId) {
      try {
        await this.linkLive.deleteFloorPlan(plan.linkLiveId);
      } catch {
        // Best effort: si Link-Live falla, seguimos borrando en local.
      }
    }
    return { deleted: await this.floorPlanService.remove(Number(id)) };
  }
}
