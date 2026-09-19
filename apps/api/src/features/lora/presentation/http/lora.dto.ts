import {
  IsArray,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

import {
  LORA_AUDIT_RESULTS,
  LORA_AUDIT_STATUSES,
} from "@features/lora/domain/entities/lora.types";

export class LoraSampleDto {
  @IsOptional() @IsInt() txCnt?: number | null;
  @IsOptional() @IsString() @MaxLength(60) time?: string | null;
  @IsOptional() @IsNumber() rssi?: number | null;
  @IsOptional() @IsNumber() rssis?: number | null;
  @IsOptional() @IsNumber() snr?: number | null;
  @IsOptional() @IsString() @MaxLength(40) signal?: string | null;
  @IsOptional() @IsInt() uplinkPacket?: number | null;
  @IsOptional() @IsInt() confirmPacket?: number | null;
  @IsOptional() @IsNumber() packetLossPct?: number | null;
  @IsOptional() @IsNumber() longitude?: number | null;
  @IsOptional() @IsNumber() latitude?: number | null;
  @IsOptional() @IsString() @MaxLength(200) location?: string | null;
  @IsOptional() @IsString() @MaxLength(60) sf?: string | null;
  @IsOptional() @IsString() @MaxLength(60) txPower?: string | null;
}

export class LoraMeasureRowDto {
  @IsOptional() @IsString() @MaxLength(300) source?: string | null;
  @IsOptional() @IsString() @MaxLength(200) location?: string | null;
  @IsOptional() @IsString() @MaxLength(60) time?: string | null;
  @IsOptional() @IsString() @MaxLength(60) spreadingFactor?: string | null;
  @IsOptional() @IsString() @MaxLength(60) txPower?: string | null;
  @IsOptional() @IsArray() samples?: LoraSampleDto[];
}

export class CreateLoraMeasuresDto {
  @IsArray()
  rows!: LoraMeasureRowDto[];
}

export class LoraNoiseEntryDto {
  @IsOptional() @IsNumber() frequency?: number | null;
  @IsOptional() @IsNumber() currentScan?: number | null;
  @IsOptional() @IsNumber() weightedAverageScan?: number | null;
}

export class LoraNoiseRowDto {
  @IsOptional() @IsString() @MaxLength(200) location?: string | null;
  @IsOptional() @IsNumber() longitude?: number | null;
  @IsOptional() @IsNumber() latitude?: number | null;
  @IsOptional() @IsArray() entries?: LoraNoiseEntryDto[];
}

export class CreateLoraNoiseDto {
  @IsArray()
  rows!: LoraNoiseRowDto[];
}

export class CreateLoraAuditDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional() @IsString() @MaxLength(60) code?: string | null;
  @IsOptional() @IsString() @MaxLength(200) client?: string | null;
  @IsOptional() @IsString() @MaxLength(200) project?: string | null;
  @IsOptional() @IsString() @MaxLength(200) location?: string | null;
  @IsOptional() @IsString() @MaxLength(120) technician?: string | null;
  @IsOptional() @IsString() description?: string | null;
  @IsOptional() @IsString() objective?: string | null;

  @IsOptional() @IsDateString() auditDate?: string | null;
  @IsOptional() @IsDateString() startDate?: string | null;
  @IsOptional() @IsDateString() endDate?: string | null;

  @IsOptional() @IsArray() @IsInt({ each: true }) measureIds?: number[];
  @IsOptional() @IsArray() @IsInt({ each: true }) noiseIds?: number[];
  @IsOptional() @IsInt() floorPlanId?: number | null;
  @IsOptional() @IsNumber() heatmapRadius?: number | null;
  @IsOptional()
  @IsString()
  @IsIn([...LORA_AUDIT_RESULTS, ""] as unknown as string[])
  result?: string | null;
}

export class UpdateLoraAuditDto {
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() @MaxLength(60) code?: string | null;
  @IsOptional() @IsString() @MaxLength(200) client?: string | null;
  @IsOptional() @IsString() @MaxLength(200) project?: string | null;
  @IsOptional() @IsString() @MaxLength(200) location?: string | null;
  @IsOptional() @IsString() @MaxLength(120) technician?: string | null;
  @IsOptional() @IsString() description?: string | null;
  @IsOptional() @IsString() objective?: string | null;

  @IsOptional() @IsDateString() auditDate?: string | null;
  @IsOptional() @IsDateString() startDate?: string | null;
  @IsOptional() @IsDateString() endDate?: string | null;

  @IsOptional() @IsArray() @IsInt({ each: true }) measureIds?: number[];
  @IsOptional() @IsArray() @IsInt({ each: true }) noiseIds?: number[];
  @IsOptional() @IsInt() floorPlanId?: number | null;
  @IsOptional() @IsNumber() heatmapRadius?: number | null;
  @IsOptional()
  @IsString()
  @IsIn([...LORA_AUDIT_RESULTS, ""] as unknown as string[])
  result?: string | null;
}

export class UpdateLoraAuditResultDto {
  @IsOptional()
  @IsString()
  @IsIn([...LORA_AUDIT_RESULTS, ""] as unknown as string[])
  result?: string | null;
}

export class UpdateLoraAuditStatusDto {
  @IsIn(LORA_AUDIT_STATUSES as unknown as string[])
  status!: string;
}

export class UpdateMeasureLocationDto {
  @IsNumber() latitude!: number;
  @IsNumber() longitude!: number;
}

export class UpdateNoiseLocationDto {
  @IsNumber() latitude!: number;
  @IsNumber() longitude!: number;
}

export class UpdateLoraAuditAntennaDto {
  @IsNumber() latitude!: number;
  @IsNumber() longitude!: number;
}
