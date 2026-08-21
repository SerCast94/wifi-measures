import { IsInt, IsObject, IsOptional, IsString } from "class-validator";

import type { AreaPlanPosition } from "@features/measures/application/area-plan.service";

export class UpsertAreaPlanDto {
  @IsString()
  name: string;

  @IsString()
  image: string;

  @IsInt()
  width: number;

  @IsInt()
  height: number;

  @IsOptional()
  @IsObject()
  positions?: Record<string, AreaPlanPosition>;
}
