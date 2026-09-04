import { Injectable, Logger } from "@nestjs/common";

import { DatabaseService } from "@core/database/database.service";

export interface ScaleCalibration {
  pixelsPerMeter: number;
  pixelDistance: number;
  realDistance: number;
  unit: "m" | "cm" | "ft";
  pointA: { x: number; y: number };
  pointB: { x: number; y: number };
}

export interface GeoCalibration {
  topLeftLat: number;
  topLeftLon: number;
  bottomRightLat: number;
  bottomRightLon: number;
}

export type FloorPlanFileType = "image" | "pdf";

export interface FloorPlanData {
  id: number;
  name: string;
  fileName: string;
  mimeType: string;
  fileType: FloorPlanFileType;
  size: number;
  floorZone: string | null;
  linkLiveId: string | null;
  image: string | null;
  originalFile: string | null;
  width: number;
  height: number;
  scale: ScaleCalibration | null;
  geoCalibration: GeoCalibration | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFloorPlanInput {
  name: string;
  fileName: string;
  mimeType: string;
  fileType: FloorPlanFileType;
  size: number;
  floorZone?: string | null;
  linkLiveId?: string | null;
  image?: string | null;
  originalFile?: string | null;
  width: number;
  height: number;
  scale?: ScaleCalibration | null;
  geoCalibration?: GeoCalibration | null;
}

export interface UpdateFloorPlanInput {
  name?: string;
  floorZone?: string | null;
  scale?: ScaleCalibration | null;
  geoCalibration?: GeoCalibration | null;
}

@Injectable()
export class FloorPlanService {
  private readonly logger = new Logger(FloorPlanService.name);

  constructor(private readonly database: DatabaseService) {}

  private get client() {
    return this.database.getClient();
  }

  async getAll(): Promise<FloorPlanData[]> {
    const client = this.client;
    if (!client) return [];
    const plans = await client.uploadedFloorPlan.findMany({
      orderBy: { createdAt: "desc" },
    });
    return plans.map((plan: any) => this.toData(plan));
  }

  async getById(id: number): Promise<FloorPlanData | null> {
    const client = this.client;
    if (!client) return null;
    const plan = await client.uploadedFloorPlan.findUnique({ where: { id } });
    if (!plan) return null;
    return this.toData(plan);
  }

  async create(input: CreateFloorPlanInput): Promise<FloorPlanData | null> {
    const client = this.client;
    if (!client) {
      throw new Error("Base de datos no disponible");
    }
    const plan = await client.uploadedFloorPlan.create({
      data: {
        name: input.name,
        fileName: input.fileName,
        mimeType: input.mimeType,
        fileType: input.fileType,
        size: input.size,
        floorZone: input.floorZone ?? null,
        linkLiveId: input.linkLiveId ?? null,
        image: input.image ?? null,
        originalFile: input.originalFile ?? null,
        width: input.width,
        height: input.height,
        scale:
          input.scale !== undefined
            ? this.sanitizeScale(input.scale)
            : undefined,
        geoCalibration:
          input.geoCalibration !== undefined
            ? this.sanitizeGeoCalibration(input.geoCalibration)
            : undefined,
      },
    });
    return this.toData(plan);
  }

  async update(
    id: number,
    input: UpdateFloorPlanInput
  ): Promise<FloorPlanData | null> {
    const client = this.client;
    if (!client) {
      throw new Error("Base de datos no disponible");
    }
    const existing = await client.uploadedFloorPlan.findUnique({
      where: { id },
    });
    if (!existing) return null;

    const plan = await client.uploadedFloorPlan.update({
      where: { id },
      data: {
        name: input.name !== undefined ? input.name : undefined,
        floorZone:
          input.floorZone !== undefined ? (input.floorZone ?? null) : undefined,
        scale:
          input.scale !== undefined
            ? this.sanitizeScale(input.scale)
            : undefined,
        geoCalibration:
          input.geoCalibration !== undefined
            ? this.sanitizeGeoCalibration(input.geoCalibration)
            : undefined,
      },
    });
    return this.toData(plan);
  }

  async remove(id: number): Promise<boolean> {
    const client = this.client;
    if (!client) return false;
    const existing = await client.uploadedFloorPlan.findUnique({
      where: { id },
    });
    if (!existing) return false;
    await client.uploadedFloorPlan.delete({ where: { id } });
    return true;
  }

  private sanitizeScale(
    scale: ScaleCalibration | null
  ): ScaleCalibration | null {
    if (!scale || typeof scale !== "object") return null;
    const pixelDistance = Number(scale.pixelDistance);
    const realDistance = Number(scale.realDistance);
    const pixelsPerMeter = Number(scale.pixelsPerMeter);
    if (
      !Number.isFinite(pixelDistance) ||
      !Number.isFinite(realDistance) ||
      !Number.isFinite(pixelsPerMeter) ||
      realDistance <= 0
    ) {
      return null;
    }
    const unit = ["m", "cm", "ft"].includes(scale.unit) ? scale.unit : "m";
    const pointA = this.sanitizePoint(scale.pointA);
    const pointB = this.sanitizePoint(scale.pointB);
    return {
      pixelDistance,
      realDistance,
      unit,
      pixelsPerMeter,
      pointA,
      pointB,
    };
  }

  private sanitizePoint(point: { x: number; y: number } | undefined) {
    const x = Number(point?.x);
    const y = Number(point?.y);
    if (!Number.isFinite(x) || !Number.isFinite(y)) return { x: 0, y: 0 };
    return { x, y };
  }

  private sanitizeGeoCalibration(
    geo: GeoCalibration | null | undefined
  ): GeoCalibration | null {
    if (!geo || typeof geo !== "object") return null;
    const topLeftLat = Number(geo.topLeftLat);
    const topLeftLon = Number(geo.topLeftLon);
    const bottomRightLat = Number(geo.bottomRightLat);
    const bottomRightLon = Number(geo.bottomRightLon);
    if (
      !Number.isFinite(topLeftLat) ||
      !Number.isFinite(topLeftLon) ||
      !Number.isFinite(bottomRightLat) ||
      !Number.isFinite(bottomRightLon)
    ) {
      return null;
    }
    return { topLeftLat, topLeftLon, bottomRightLat, bottomRightLon };
  }

  private toData(plan: any): FloorPlanData {
    return {
      id: plan.id,
      name: plan.name,
      fileName: plan.fileName,
      mimeType: plan.mimeType,
      fileType: plan.fileType === "pdf" ? "pdf" : "image",
      size: plan.size,
      floorZone: plan.floorZone ?? null,
      linkLiveId: plan.linkLiveId ?? null,
      image: plan.image ?? null,
      originalFile: plan.originalFile ?? null,
      width: plan.width,
      height: plan.height,
      scale: (plan.scale as ScaleCalibration | null) ?? null,
      geoCalibration: (plan.geoCalibration as GeoCalibration | null) ?? null,
      createdAt: plan.createdAt,
      updatedAt: plan.updatedAt,
    };
  }
}
