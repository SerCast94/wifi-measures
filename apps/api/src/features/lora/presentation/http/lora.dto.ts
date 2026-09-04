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

import { LORA_AUDIT_STATUSES } from "@features/lora/domain/entities/lora.types";

export class LoraMeasureBlockDto {
  @IsOptional() @IsString() @MaxLength(20) role?: string | null;
  @IsOptional() @IsNumber() totalPackets?: number | null;
  @IsOptional() @IsNumber() successfulPackets?: number | null;
  @IsOptional() @IsNumber() rssi?: number | null;
  @IsOptional() @IsNumber() snr?: number | null;
  @IsOptional() @IsNumber() packetLossPct?: number | null;
  @IsOptional() @IsNumber() longitude?: number | null;
  @IsOptional() @IsNumber() latitude?: number | null;
  @IsOptional() @IsString() @MaxLength(200) location?: string | null;
}

export class LoraMeasureRowDto {
  @IsOptional() @IsString() @MaxLength(200) location?: string | null;
  @IsOptional() @IsString() @MaxLength(60) time?: string | null;
  @IsOptional() @IsString() @MaxLength(60) spreadingFactor?: string | null;
  @IsOptional() @IsString() @MaxLength(60) txPower?: string | null;
  @IsOptional() @IsArray() blocks?: LoraMeasureBlockDto[];
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

  @IsOptional() @IsInt() measureId?: number | null;
  @IsOptional() @IsInt() noiseId?: number | null;
  @IsOptional() @IsInt() floorPlanId?: number | null;
}

export class UpdateLoraAuditDto extends CreateLoraAuditDto {}

export class UpdateLoraAuditStatusDto {
  @IsIn(LORA_AUDIT_STATUSES as unknown as string[])
  status!: string;
}
