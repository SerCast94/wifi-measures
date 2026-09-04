import {
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class ExteriorHeatmapPointDto {
  @IsNumber()
  lat: number;

  @IsNumber()
  lon: number;

  @IsNumber()
  value: number;

  @IsString()
  label: string;
}

export class CreateExteriorHeatmapDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsIn(["WIFI", "LORA"])
  tipo?: "WIFI" | "LORA";

  @IsOptional()
  @IsString()
  auditId?: string | null;

  @IsOptional()
  @IsString()
  loraAuditId?: string | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExteriorHeatmapPointDto)
  points?: ExteriorHeatmapPointDto[];
}

export class UpdateExteriorHeatmapDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ExteriorHeatmapPointDto)
  points?: ExteriorHeatmapPointDto[] | null;
}
