import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ScalePointPresenter {
  @ApiProperty({ type: "number", example: 0.35 })
  x: number;
  @ApiProperty({ type: "number", example: 0.62 })
  y: number;

  constructor(point: { x: number; y: number }) {
    this.x = point.x;
    this.y = point.y;
  }
}

export class ScaleCalibrationPresenter {
  @ApiProperty({ type: "number", example: 50 })
  pixelsPerMeter: number;
  @ApiProperty({ type: "number", example: 500 })
  pixelDistance: number;
  @ApiProperty({ type: "number", example: 10 })
  realDistance: number;
  @ApiProperty({ type: "string", example: "m" })
  unit: "m" | "cm" | "ft";
  @ApiProperty({ type: ScalePointPresenter })
  pointA: ScalePointPresenter;
  @ApiProperty({ type: ScalePointPresenter })
  pointB: ScalePointPresenter;

  constructor(scale: any) {
    this.pixelsPerMeter = Number(scale.pixelsPerMeter) || 0;
    this.pixelDistance = Number(scale.pixelDistance) || 0;
    this.realDistance = Number(scale.realDistance) || 0;
    this.unit = (["m", "cm", "ft"].includes(scale.unit) ? scale.unit : "m") as
      | "m"
      | "cm"
      | "ft";
    this.pointA = new ScalePointPresenter(scale.pointA ?? { x: 0, y: 0 });
    this.pointB = new ScalePointPresenter(scale.pointB ?? { x: 0, y: 0 });
  }
}

export class GeoCalibrationPresenter {
  @ApiProperty({ type: "number", example: 40.4168 })
  topLeftLat: number;
  @ApiProperty({ type: "number", example: -3.7038 })
  topLeftLon: number;
  @ApiProperty({ type: "number", example: 40.41 })
  bottomRightLat: number;
  @ApiProperty({ type: "number", example: -3.698 })
  bottomRightLon: number;

  constructor(geo: any) {
    this.topLeftLat = Number(geo?.topLeftLat) || 0;
    this.topLeftLon = Number(geo?.topLeftLon) || 0;
    this.bottomRightLat = Number(geo?.bottomRightLat) || 0;
    this.bottomRightLon = Number(geo?.bottomRightLon) || 0;
  }
}

export class FloorPlanPresenter {
  @ApiProperty({ type: "number", example: 1 })
  id: number;
  @ApiProperty({ type: "string", example: "Plano planta 1" })
  name: string;
  @ApiProperty({ type: "string", example: "planta-1.png" })
  fileName: string;
  @ApiProperty({ type: "string", example: "image/png" })
  mimeType: string;
  @ApiProperty({ type: "string", example: "image" })
  fileType: "image" | "pdf";
  @ApiProperty({ type: "number", example: 204800 })
  size: number;
  @ApiPropertyOptional({ type: "string", example: "Planta 1" })
  floorZone?: string | null;
  @ApiPropertyOptional({ type: "string", example: "f8a4..." })
  linkLiveId?: string | null;
  @ApiPropertyOptional({ type: "string" })
  image?: string | null;
  @ApiPropertyOptional({ type: "string" })
  originalFile?: string | null;
  @ApiProperty({ type: "number", example: 1920 })
  width: number;
  @ApiProperty({ type: "number", example: 1080 })
  height: number;
  @ApiPropertyOptional({ type: ScaleCalibrationPresenter })
  scale?: ScaleCalibrationPresenter | null;
  @ApiPropertyOptional({ type: GeoCalibrationPresenter })
  geoCalibration?: GeoCalibrationPresenter | null;
  @ApiProperty({ type: "string", example: "2026-08-31T00:00:00Z" })
  createdAt: Date;
  @ApiProperty({ type: "string", example: "2026-08-31T00:00:00Z" })
  updatedAt: Date;

  constructor(data: any, options?: { includeImage?: boolean }) {
    const includeImage = options?.includeImage ?? false;
    this.id = data.id;
    this.name = data.name;
    this.fileName = data.fileName;
    this.mimeType = data.mimeType;
    this.fileType = data.fileType === "pdf" ? "pdf" : "image";
    this.size = data.size;
    this.floorZone = data.floorZone ?? null;
    this.linkLiveId = data.linkLiveId ?? null;
    this.image = includeImage ? (data.image ?? null) : null;
    this.originalFile = includeImage ? (data.originalFile ?? null) : null;
    this.width = data.width;
    this.height = data.height;
    this.scale = data.scale ? new ScaleCalibrationPresenter(data.scale) : null;
    this.geoCalibration = data.geoCalibration
      ? new GeoCalibrationPresenter(data.geoCalibration)
      : null;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
