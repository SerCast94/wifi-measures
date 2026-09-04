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
  topRightLat: number;
  topRightLon: number;
  bottomRightLat: number;
  bottomRightLon: number;
  bottomLeftLat: number;
  bottomLeftLon: number;
}

/**
 * Normaliza una georreferenciación permitiendo que falten algunas esquinas.
 * Para datos antiguos (solo top-left y bottom-right), rellena las esquinas
 * restantes derivándolas de un encuadre rectangular alineado al eje.
 */
export const normalizeGeoCalibration = (
  geo: Partial<GeoCalibration> | null | undefined
): GeoCalibration | null => {
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
  return {
    topLeftLat,
    topLeftLon,
    topRightLat: Number(geo.topRightLat) || topLeftLat,
    topRightLon: Number(geo.topRightLon) || bottomRightLon,
    bottomRightLat,
    bottomRightLon,
    bottomLeftLat: Number(geo.bottomLeftLat) || bottomRightLat,
    bottomLeftLon: Number(geo.bottomLeftLon) || topLeftLon,
  };
};

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
