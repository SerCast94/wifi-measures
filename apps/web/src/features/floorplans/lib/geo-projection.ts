import type {
  GeoCalibration,
  ScaleCalibration,
  ScaleUnit,
} from "../types/floorplan.types";

/**
 * Proyecta las coordenadas normalizadas (0-100) de un punto sobre la imagen
 * del plano a latitud/longitud reales, usando la georreferenciación del plano
 * (esquinas top-left y bottom-right en lat/lon).
 */
export const projectToLatLon = (
  x: number,
  y: number,
  geo: GeoCalibration
): { lat: number; lon: number } | null => {
  const latSpan = geo.topLeftLat - geo.bottomRightLat;
  const lonSpan = geo.bottomRightLon - geo.topLeftLon;
  if (latSpan === 0 || lonSpan === 0) return null;
  const px = Math.max(0, Math.min(100, x));
  const py = Math.max(0, Math.min(100, y));
  const lat = geo.topLeftLat - (py / 100) * latSpan;
  const lon = geo.topLeftLon + (px / 100) * lonSpan;
  return { lat, lon };
};

/**
 * Proyecta una latitud/longitud real a coordenadas normalizadas (0-100) sobre
 * la imagen del plano.
 */
export const projectToImageXY = (
  lat: number,
  lon: number,
  geo: GeoCalibration
): { x: number; y: number } | null => {
  const latSpan = geo.topLeftLat - geo.bottomRightLat;
  const lonSpan = geo.bottomRightLon - geo.topLeftLon;
  if (latSpan === 0 || lonSpan === 0) return null;
  const x = ((lon - geo.topLeftLon) / lonSpan) * 100;
  const y = ((geo.topLeftLat - lat) / latSpan) * 100;
  if (x < -0.001 || x > 100.001 || y < -0.001 || y > 100.001) return null;
  return { x, y };
};

const EARTH_RADIUS_M = 6378137;

const toRad = (deg: number): number => (deg * Math.PI) / 180;

/**
 * Distancia en metros entre dos coordenadas geográficas usando la fórmula
 * esférica (Haversine aproximada por una latitud media).
 */
export const geoDistanceMeters = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const meanLat = toRad((lat1 + lat2) / 2);
  const dLat = lat1 - lat2;
  const dLon = lon1 - lon2;
  const x = (dLon * toRad(1) * Math.cos(meanLat)) * (EARTH_RADIUS_M / 180);
  const y = dLat * (EARTH_RADIUS_M / 180);
  return Math.hypot(x, y);
};

/**
 * Calcula la escala (pixelsPerMeter) de un plano a partir de su
 * georreferenciación y sus dimensiones en píxeles. Usa el ancho real en metros
 * entre las esquinas top-left y bottom-right del encuadre del mapa.
 *
 * Devuelve un ScaleCalibration sin puntos de calibración manuales (usados solo
 * para planos escaneados). Devuelve null si no es posible calcularla.
 */
export const computeScaleFromGeoCalibration = (
  geo: GeoCalibration,
  imageWidthPx: number,
  imageHeightPx: number
): { scale: ScaleCalibration; unit: ScaleUnit } | null => {
  const widthMeters = geoDistanceMeters(
    geo.topLeftLat,
    geo.topLeftLon,
    geo.topLeftLat,
    geo.bottomRightLon
  );
  const heightMeters = geoDistanceMeters(
    geo.topLeftLat,
    geo.topLeftLon,
    geo.bottomRightLat,
    geo.topLeftLon
  );
  if (
    !Number.isFinite(widthMeters) ||
    !Number.isFinite(heightMeters) ||
    widthMeters <= 0 ||
    heightMeters <= 0 ||
    imageWidthPx <= 0 ||
    imageHeightPx <= 0
  ) {
    return null;
  }
  const pixelsPerMeter = widthMeters > 0 ? imageWidthPx / widthMeters : 0;
  if (!Number.isFinite(pixelsPerMeter) || pixelsPerMeter <= 0) return null;
  const scale: ScaleCalibration = {
    pixelsPerMeter,
    pixelDistance: imageWidthPx,
    realDistance: widthMeters,
    unit: "m",
    pointA: { x: 0, y: 0.5 },
    pointB: { x: 1, y: 0.5 },
  };
  return { scale, unit: "m" };
};
