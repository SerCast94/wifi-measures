export type ScaleUnit = "m" | "cm" | "ft";

export interface ScalePoint {
  x: number;
  y: number;
}

export interface ScaleCalibration {
  pixelsPerMeter: number;
  pixelDistance: number;
  realDistance: number;
  unit: ScaleUnit;
  pointA: ScalePoint;
  pointB: ScalePoint;
}

export interface GeoCalibration {
  topLeftLat: number;
  topLeftLon: number;
  bottomRightLat: number;
  bottomRightLon: number;
}

export type FloorPlanFileType = "image" | "pdf";

export const isExteriorPlan = (plan: {
  floorZone?: string | null;
}): boolean => (plan.floorZone ?? "").trim().toLowerCase() === "mapa exterior";

export interface FloorPlan {
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
  createdAt: string;
  updatedAt: string;
}

export interface CreateFloorPlanPayload {
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

export interface UpdateFloorPlanPayload {
  name?: string;
  floorZone?: string | null;
  scale?: ScaleCalibration | null;
  geoCalibration?: GeoCalibration | null;
}
