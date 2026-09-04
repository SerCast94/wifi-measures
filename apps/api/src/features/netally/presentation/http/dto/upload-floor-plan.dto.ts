import { IsArray, IsNumber, IsOptional, IsString } from "class-validator";

export class UploadFloorPlanDto {
  @IsString() imageBase64!: string;

  @IsOptional() @IsArray() @IsString({ each: true }) labels?: string[];

  @IsString() fileName!: string;
  @IsString() floorPlanName!: string;

  @IsNumber() floorPlanWidthPx!: number;
  @IsNumber() floorPlanHeightPx!: number;
  @IsNumber() floorPlanScalePpf!: number;

  @IsString() unit!: string;
  @IsNumber() width!: number | string;
  @IsNumber() height!: number | string;
}
