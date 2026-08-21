import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

import {
  getSurveyMetricDefinition,
  SURVEY_METRICS,
} from "@features/surveys/domain/survey-metrics";

export class SurveyPointPresenter {
  @ApiProperty({ type: "number", example: 0 })
  pointIdx: number;
  @ApiProperty({ type: "number", example: 12.5 })
  x: number;
  @ApiProperty({ type: "number", example: 68.4 })
  y: number;
  @ApiPropertyOptional({ type: "number", example: -49 })
  value?: number | null;
  @ApiPropertyOptional({ type: "string", example: "2026-07-17T07:54:07.276Z" })
  time?: string | null;

  constructor(point: any) {
    this.pointIdx = point.pointIdx ?? 0;
    this.x = point.x;
    this.y = point.y;
    this.value = point.value ?? null;
    this.time = point.time ?? null;
  }
}

export class SurveyMetricPresenter {
  @ApiProperty({ type: "string", example: "signal" })
  key: string;
  @ApiProperty({ type: "string", example: "Señal" })
  label: string;
  @ApiProperty({ type: "string", example: "dBm" })
  unit: string;
  @ApiProperty({ type: SurveyPointPresenter, isArray: true })
  points: SurveyPointPresenter[];

  constructor(key: string, points: any[]) {
    const definition = getSurveyMetricDefinition(key);
    this.key = definition.key;
    this.label = definition.label;
    this.unit = definition.unit;
    this.points = points.map((point) => new SurveyPointPresenter(point));
  }
}

export class SurveyPresenter {
  @ApiProperty({ type: "number", example: 1 })
  id: number;
  @ApiProperty({ type: "string", example: "6a59e1c3f2214038bb5433d2" })
  idLinkLive: string;
  @ApiPropertyOptional({ type: "string", example: "Planta 2-20260717" })
  name?: string | null;
  @ApiPropertyOptional({ type: "string" })
  surveyName?: string | null;
  @ApiPropertyOptional({ type: "string" })
  surveyDescription?: string | null;
  @ApiPropertyOptional({ type: "string", example: "passive" })
  surveyMode?: string | null;
  @ApiProperty({ type: "number", example: 17 })
  surveyPointCount: number;
  @ApiProperty({ type: "boolean", example: true })
  surveyBluetooth: boolean;
  @ApiProperty({ type: "boolean", example: true })
  surveyActive1x1: boolean;
  @ApiPropertyOptional({ type: "string", example: "MAGTEL TI" })
  ssid1x1?: string | null;
  @ApiPropertyOptional({ type: "string" })
  unitName?: string | null;
  @ApiPropertyOptional({ type: "string", example: "AirCheckG3" })
  unitType?: string | null;
  @ApiPropertyOptional({ type: "string", example: "AIRCHECK-G3E-PRO" })
  unitHardware?: string | null;
  @ApiPropertyOptional({ type: "string" })
  unitMac?: string | null;
  @ApiPropertyOptional({ type: "string" })
  unitSerial?: string | null;
  @ApiPropertyOptional({ type: "string", example: "ready" })
  status?: string | null;
  @ApiPropertyOptional({ type: "string", example: "MAPA PLANTA2.png" })
  floorPlanFilename?: string | null;
  @ApiProperty({ type: "number", example: 4096 })
  floorPlanWidth: number;
  @ApiProperty({ type: "number", example: 1575 })
  floorPlanHeight: number;
  @ApiProperty({ type: "number", example: 1500 })
  floorPlanScaledWidth: number;
  @ApiProperty({ type: "number", example: 576 })
  floorPlanScaledHeight: number;
  @ApiPropertyOptional({ type: "string" })
  analysisGuid?: string | null;
  @ApiPropertyOptional({ type: "string", example: "2026-07-17T07:54:07.276Z" })
  surveyStartTime?: Date | null;
  @ApiPropertyOptional({ type: "string" })
  image?: string | null;
  @ApiProperty({ type: "string", example: "2026-08-19T00:00:00Z" })
  createdAt: Date;
  @ApiProperty({ type: "string", example: "2026-08-19T00:00:00Z" })
  updatedAt: Date;
  @ApiPropertyOptional({ type: SurveyMetricPresenter, isArray: true })
  metrics?: SurveyMetricPresenter[];

  constructor(
    survey: any,
    points?: any[],
    options?: { includeImage?: boolean }
  ) {
    const includeImage = options?.includeImage ?? true;
    this.id = survey.id;
    this.idLinkLive = survey.idLinkLive;
    this.name = survey.name ?? null;
    this.surveyName = survey.surveyName ?? null;
    this.surveyDescription = survey.surveyDescription ?? null;
    this.surveyMode = survey.surveyMode ?? null;
    this.surveyPointCount = survey.surveyPointCount ?? 0;
    this.surveyBluetooth = survey.surveyBluetooth ?? false;
    this.surveyActive1x1 = survey.surveyActive1x1 ?? false;
    this.ssid1x1 = survey.ssid1x1 ?? null;
    this.unitName = survey.unitName ?? null;
    this.unitType = survey.unitType ?? null;
    this.unitHardware = survey.unitHardware ?? null;
    this.unitMac = survey.unitMac ?? null;
    this.unitSerial = survey.unitSerial ?? null;
    this.status = survey.status ?? null;
    this.floorPlanFilename = survey.floorPlanFilename ?? null;
    this.floorPlanWidth = survey.floorPlanWidth ?? 0;
    this.floorPlanHeight = survey.floorPlanHeight ?? 0;
    this.floorPlanScaledWidth = survey.floorPlanScaledWidth ?? 0;
    this.floorPlanScaledHeight = survey.floorPlanScaledHeight ?? 0;
    this.analysisGuid = survey.analysisGuid ?? null;
    this.surveyStartTime = survey.surveyStartTime ?? null;
    this.image = includeImage ? (survey.image ?? null) : null;
    this.createdAt = survey.createdAt;
    this.updatedAt = survey.updatedAt;

    if (points) {
      this.metrics = SURVEY_METRICS.map(
        (metric) =>
          new SurveyMetricPresenter(
            metric.key,
            points.filter((point) => point.metric === metric.key)
          )
      ).filter((metric) => metric.points.length > 0);
    }
  }
}
