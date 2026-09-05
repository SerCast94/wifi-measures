import type {
  GeoCalibration,
  ScaleCalibration,
  ScaleUnit,
} from "../types/floorplan.types";

/**
 * Proyecta las coordenadas normalizadas (0-100) de un punto sobre la imagen
 * del plano a latitud/longitud reales, usando la georreferenciación de las
 * cuatro esquinas del encuadre (top-left, top-right, bottom-right, bottom-left).
 */
export const projectToLatLon = (
  x: number,
  y: number,
  geo: GeoCalibration
): { lat: number; lon: number } | null => {
  const px = Math.max(0, Math.min(100, x)) / 100;
  const py = Math.max(0, Math.min(100, y)) / 100;

  const topLat = geo.topLeftLat + (geo.topRightLat - geo.topLeftLat) * px;
  const bottomLat =
    geo.bottomLeftLat + (geo.bottomRightLat - geo.bottomLeftLat) * px;
  const lat = topLat + (bottomLat - topLat) * py;

  const leftLon = geo.topLeftLon + (geo.bottomLeftLon - geo.topLeftLon) * py;
  const rightLon =
    geo.topRightLon + (geo.bottomRightLon - geo.topRightLon) * py;
  const lon = leftLon + (rightLon - leftLon) * px;

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return { lat, lon };
};

/**
 * Proyecta una latitud/longitud real a coordenadas normalizadas (0-100) sobre
 * la imagen del plano.
 *
 * Si el encuadre es un rectángulo alineado al eje (caso de los planos generados
 * desde el mapa, donde TL/TR comparten latitud y TL/BL comparten longitud), la
 * inversa es lineal y exacta. En caso contrario se resuelve por iteración con
 * convergencia reforzada.
 */
export const projectToImageXY = (
  lat: number,
  lon: number,
  geo: GeoCalibration
): { x: number; y: number } | null => {
  const axisAligned =
    geo.topLeftLat === geo.topRightLat &&
    geo.bottomLeftLat === geo.bottomRightLat &&
    geo.topLeftLon === geo.bottomLeftLon &&
    geo.topRightLon === geo.bottomRightLon;

  if (axisAligned) {
    const lon0 = geo.topLeftLon;
    const lon1 = geo.topRightLon;
    const lat0 = geo.topLeftLat;
    const lat1 = geo.bottomLeftLat;
    if (lon1 === lon0 || lat1 === lat0) return null;
    const x = ((lon - lon0) / (lon1 - lon0)) * 100;
    // y crece hacia abajo en la imagen: lat1 (bottom) < lat0 (top)
    const y = ((lat0 - lat) / (lat0 - lat1)) * 100;
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    if (x < -0.001 || x > 100.001 || y < -0.001 || y > 100.001) return null;
    return { x, y };
  }

  let x = 0.5;
  let y = 0.5;
  // Newton con ganancia suavizada: empieza ancho y se afina al converger.
  for (let i = 0; i < 40; i++) {
    const p = projectToLatLon(x * 100, y * 100, geo);
    if (!p) return null;
    const dx = p.lon - lon;
    const dy = p.lat - lat;
    if (Math.abs(dx) < 1e-7 && Math.abs(dy) < 1e-7) break;
    x += dx * 4;
    y -= dy * 4;
  }
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
 * georreferenciación y sus dimensiones en píxeles. Usa el ancho y alto reales
 * estimados entre las esquinas del encuadre del mapa.
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
    geo.topRightLat,
    geo.topRightLon
  );
  const heightMeters = geoDistanceMeters(
    geo.topLeftLat,
    geo.topLeftLon,
    geo.bottomLeftLat,
    geo.bottomLeftLon
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
