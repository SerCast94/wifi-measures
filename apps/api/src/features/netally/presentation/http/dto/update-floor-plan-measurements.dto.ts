import { IsNumber, IsString } from "class-validator";

export class UpdateFloorPlanMeasurementsDto {
  @IsString() linkLiveId!: string;
  @IsNumber() floorPlanScalePpf!: number;
  @IsString() unit!: string;
  @IsNumber() width!: number | string;
  @IsNumber() height!: number | string;
}
