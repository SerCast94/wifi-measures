import {
  IsIn,
  IsInt,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

class ScalePointDto {
  @IsNumber()
  x: number;

  @IsNumber()
  y: number;
}

class ScaleCalibrationDto {
  @IsNumber()
  pixelsPerMeter: number;

  @IsNumber()
  pixelDistance: number;

  @IsNumber()
  realDistance: number;

  @IsIn(["m", "cm", "ft"])
  unit: "m" | "cm" | "ft";

  @IsObject()
  @ValidateNested()
  @Type(() => ScalePointDto)
  pointA: ScalePointDto;

  @IsObject()
  @ValidateNested()
  @Type(() => ScalePointDto)
  pointB: ScalePointDto;
}

class GeoCalibrationDto {
  @IsNumber()
  topLeftLat: number;

  @IsNumber()
  topLeftLon: number;

  @IsOptional()
  @IsNumber()
  topRightLat: number;

  @IsOptional()
  @IsNumber()
  topRightLon: number;

  @IsNumber()
  bottomRightLat: number;

  @IsNumber()
  bottomRightLon: number;

  @IsOptional()
  @IsNumber()
  bottomLeftLat: number;

  @IsOptional()
  @IsNumber()
  bottomLeftLon: number;
}

export class CreateFloorPlanDto {
  @IsString()
  name: string;

  @IsString()
  fileName: string;

  @IsString()
  mimeType: string;

  @IsIn(["image", "pdf"])
  fileType: "image" | "pdf";

  @IsInt()
  size: number;

  @IsOptional()
  @IsString()
  floorZone?: string | null;

  @IsOptional()
  @IsString()
  linkLiveId?: string | null;

  @IsOptional()
  @IsString()
  image?: string | null;

  @IsOptional()
  @IsString()
  originalFile?: string | null;

  @IsInt()
  width: number;

  @IsInt()
  height: number;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ScaleCalibrationDto)
  scale?: ScaleCalibrationDto | null;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => GeoCalibrationDto)
  geoCalibration?: GeoCalibrationDto | null;
}

export class UpdateFloorPlanDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  floorZone?: string | null;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => ScaleCalibrationDto)
  scale?: ScaleCalibrationDto | null;

  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => GeoCalibrationDto)
  geoCalibration?: GeoCalibrationDto | null;
}
