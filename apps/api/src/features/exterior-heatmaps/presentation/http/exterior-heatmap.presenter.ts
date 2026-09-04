import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class ExteriorHeatmapPointPresenter {
  @ApiProperty({ type: "number", example: 40.4168 })
  lat: number;
  @ApiProperty({ type: "number", example: -3.7038 })
  lon: number;
  @ApiProperty({ type: "number", example: -62 })
  value: number;
  @ApiProperty({ type: "string", example: "Zona 1" })
  label: string;

  constructor(point: any) {
    this.lat = Number(point?.lat) || 0;
    this.lon = Number(point?.lon) || 0;
    this.value = Number(point?.value) || 0;
    this.label = String(point?.label ?? "");
  }
}

export class ExteriorHeatmapPresenter {
  @ApiProperty({ type: "string", example: "uuid" })
  id: string;
  @ApiProperty({ type: "string", example: "Mapa exterior auditoría" })
  name: string;
  @ApiProperty({ type: "string", example: "WIFI" })
  tipo: "WIFI" | "LORA";
  @ApiPropertyOptional({ type: "string", example: "uuid" })
  auditId?: string | null;
  @ApiPropertyOptional({ type: "string", example: "uuid" })
  loraAuditId?: string | null;
  @ApiProperty({ type: ExteriorHeatmapPointPresenter, isArray: true })
  points: ExteriorHeatmapPointPresenter[];
  @ApiProperty({ type: "string", example: "2026-09-03T00:00:00Z" })
  createdAt: Date;
  @ApiProperty({ type: "string", example: "2026-09-03T00:00:00Z" })
  updatedAt: Date;

  constructor(data: any) {
    this.id = data.id;
    this.name = data.name;
    this.tipo = data.tipo === "LORA" ? "LORA" : "WIFI";
    this.auditId = data.auditId ?? null;
    this.loraAuditId = data.loraAuditId ?? null;
    this.points = Array.isArray(data.points)
      ? data.points.map((p: any) => new ExteriorHeatmapPointPresenter(p))
      : [];
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }
}
