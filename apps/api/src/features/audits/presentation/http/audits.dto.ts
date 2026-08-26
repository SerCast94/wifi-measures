import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

import {
  AUDIT_STATUSES,
  AUDIT_TEST_SECTIONS,
  ISSUE_SEVERITIES,
  RECOMMENDATION_CATEGORIES,
} from "@features/audits/domain/entities/audit.types";
import { REPORT_SECTIONS } from "@features/audits/application/audit-report.service";

export class CreateAuditDto {
  @IsString()
  @MaxLength(200)
  name!: string;

  @IsOptional() @IsString() @MaxLength(60) code?: string;
  @IsOptional() @IsString() @MaxLength(200) client?: string;
  @IsOptional() @IsString() @MaxLength(200) project?: string;
  @IsOptional() @IsString() @MaxLength(200) location?: string;
  @IsOptional() @IsString() @MaxLength(300) address?: string;
  @IsOptional() @IsString() @MaxLength(200) building?: string;
  @IsOptional() @IsString() @MaxLength(120) technician?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() objective?: string;
  @IsOptional() @IsString() scope?: string;
  @IsOptional() @IsString() methodology?: string;
  @IsOptional() @IsString() observations?: string;

  @IsOptional() @IsDateString() auditDate?: string | null;
  @IsOptional() @IsDateString() startDate?: string | null;
  @IsOptional() @IsDateString() endDate?: string | null;

  @IsOptional() @IsString() profileId?: string | null;
  @IsOptional() @IsArray() @IsString({ each: true }) areaKeys?: string[];
  @IsOptional() @IsString() ssidFilter?: string | null;

  @IsOptional() @IsArray() @IsString({ each: true }) floorNames?: string[];
}

export class UpdateAuditDto {
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() code?: string;
  @IsOptional() @IsString() client?: string;
  @IsOptional() @IsString() project?: string;
  @IsOptional() @IsString() location?: string;
  @IsOptional() @IsString() address?: string;
  @IsOptional() @IsString() building?: string;
  @IsOptional() @IsString() technician?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() objective?: string;
  @IsOptional() @IsString() scope?: string;
  @IsOptional() @IsString() methodology?: string;
  @IsOptional() @IsString() observations?: string;
  @IsOptional() @IsDateString() auditDate?: string | null;
  @IsOptional() @IsDateString() startDate?: string | null;
  @IsOptional() @IsDateString() endDate?: string | null;
  @IsOptional() @IsString() profileId?: string | null;
  @IsOptional() @IsArray() @IsString({ each: true }) areaKeys?: string[];
  @IsOptional() @IsString() ssidFilter?: string | null;
  @IsOptional() @IsArray() @IsString({ each: true }) floorNames?: string[];
}

export class UpdateStatusDto {
  @IsIn(AUDIT_STATUSES as unknown as string[])
  status!: string;
}

export class UpdateTestDto {
  @IsOptional()
  @IsIn(["PENDIENTE", "COMPLETADA", "NO_APLICABLE"])
  status?: string;

  @IsOptional() @IsString() notes?: string;
}

export class AddManualTestDto {
  @IsString() @MaxLength(300) title!: string;
  @IsIn(AUDIT_TEST_SECTIONS as unknown as string[])
  section!: string;
}

export class AddMembersDto {
  /** measure | survey | analysis */
  @IsIn(["measure", "survey", "analysis"])
  type!: "measure" | "survey" | "analysis";

  @IsArray()
  ids!: Array<string | number>;

  @IsOptional()
  @IsInt()
  floorId?: number | null;
}

export class SetFloorsDto {
  @IsArray() @IsString({ each: true })
  names!: string[];
}

export class UpdateMemberDto {
  @IsOptional() @IsInt() floorId?: number | null;
  @IsOptional() @IsString() @MaxLength(120) label?: string;
}

export class UpdateProfileDto {
  @IsOptional() @IsString() @MaxLength(200) name?: string;
  @IsOptional() @IsString() description?: string;
  /** Ítems adicionales de checklist: [{ section, key?, title, required? }] */
  @IsOptional() checklistExtras?: unknown;
}

export class CreateIssueDto {
  @IsString() @MaxLength(300) title!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsIn(ISSUE_SEVERITIES as unknown as string[]) severity?: string;
  @IsOptional() @IsString() locationLabel?: string;
  @IsOptional() @IsInt() floorId?: number | null;
  @IsOptional() @IsString() metric?: string;
  @IsOptional() value?: number | null;
  @IsOptional() @IsString() unit?: string;
  @IsOptional() evidence?: unknown;
  @IsOptional() @IsString() photo?: string;
  @IsOptional() @IsString() recommendationText?: string;
}

export class UpdateIssueDto {
  @IsOptional()
  @IsIn(["SUGERIDA", "ACEPTADA", "MODIFICADA", "DESCARTADA"])
  state?: string;

  @IsOptional() @IsIn(ISSUE_SEVERITIES as unknown as string[]) severity?: string;
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() type?: string;
  @IsOptional() @IsString() locationLabel?: string;
  @IsOptional() @IsString() recommendationText?: string;
  @IsOptional() @IsString() photo?: string;
}

export class CreateRecommendationDto {
  @IsString() text!: string;
  @IsOptional() @IsIn(RECOMMENDATION_CATEGORIES as unknown as string[]) category?: string;
}

export class UpdateRecommendationDto {
  @IsOptional() @IsString() text?: string;
  @IsOptional() @IsIn(RECOMMENDATION_CATEGORIES as unknown as string[]) category?: string;
  @IsOptional() @IsBoolean() accepted?: boolean;
}

export class UpdateConclusionDto {
  @IsOptional() @IsString() finalText?: string;
  @IsOptional()
  @IsIn(["APROBADO", "APROBADO_CON_OBSERVACIONES", "NO_CONFORME", "SIN_DATOS_SUFICIENTES"])
  globalResult?: string;
}

export class SaveReportDto {
  @IsArray()
  @IsIn(REPORT_SECTIONS as unknown as string[], { each: true })
  sections!: string[];
}
