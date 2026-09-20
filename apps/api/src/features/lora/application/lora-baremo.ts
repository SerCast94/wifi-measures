// Baremo único de calidad LoRa/LoRaWAN.
// IMPORTANTE: mantener este fichero IDÉNTICO en:
//   apps/api/src/features/lora/application/lora-baremo.ts
//   apps/web/src/features/lora/lib/lora-baremo.ts

export type LoraQualityLevel =
  | "EXCELENTE"
  | "BUENA"
  | "ACEPTABLE"
  | "DEBIL"
  | "CRITICA"
  | "SIN_COBERTURA";

export interface LoraLevelDef {
  key: LoraQualityLevel;
  label: string;
  color: string;
}

export const LORA_LEVELS: LoraLevelDef[] = [
  { key: "EXCELENTE", label: "Excelente", color: "#15803d" },
  { key: "BUENA", label: "Buena", color: "#4ade80" },
  { key: "ACEPTABLE", label: "Aceptable", color: "#eab308" },
  { key: "DEBIL", label: "Débil", color: "#f97316" },
  { key: "CRITICA", label: "Crítica", color: "#dc2626" },
  { key: "SIN_COBERTURA", label: "Sin cobertura", color: "#991b1b" },
];

export const LORA_LEVEL_COLOR: Record<LoraQualityLevel, string> =
  Object.fromEntries(
    LORA_LEVELS.map(({ key, color }) => [key, color])
  ) as Record<LoraQualityLevel, string>;

export const LORA_LEVEL_LABEL: Record<LoraQualityLevel, string> =
  Object.fromEntries(
    LORA_LEVELS.map(({ key, label }) => [key, label])
  ) as Record<LoraQualityLevel, string>;

// Umbrales (frontera inferior de cada nivel para RSSI y SNR).
export const LORA_THRESHOLDS = {
  rssi: {
    excelente: -70,
    buena: -85,
    aceptable: -100,
    debil: -115,
  },
  snr: {
    excelente: 10,
    buena: 5,
    aceptable: 0,
    debil: -5,
  },
} as const;

// Piso de SNR teórico por SF (Semtech SX127x/SX126x): LoRa demodula bajo el ruido.
export const SNR_FLOOR_BY_SF: Record<string, number> = {
  SF7: -7.5,
  SF8: -10,
  SF9: -12.5,
  SF10: -15,
  SF11: -17.5,
  SF12: -20,
};

// Margen LoRa real = SNR medido - piso teórico del SF (dB).
// Este margen sí refleja la robustez del enlace LoRa.
export const LORA_SNR_MARGIN_THRESHOLDS = {
  excelente: 10,
  buena: 5,
  aceptable: 0,
  debil: -5,
} as const;

// Normaliza el SF de entrada a clave de piso: acepta "SF10", "SF10-DR2", "SF10 DR2", ...
export const sfFloorKey = (sf: string | null | undefined): string | null => {
  if (!sf) return null;
  const match = String(sf).toUpperCase().match(/(SF\d+)/);
  return match ? match[0] : null;
};

export const snrMarginLevel = (
  snr: number,
  sf: string | null
): LoraQualityLevel => {
  const sfKey = sfFloorKey(sf);
  const floor = sfKey ? SNR_FLOOR_BY_SF[sfKey] ?? -20 : -20; // conservador si SF desconocido
  const margin = snr - floor;
  if (margin >= LORA_SNR_MARGIN_THRESHOLDS.excelente) return "EXCELENTE";
  if (margin >= LORA_SNR_MARGIN_THRESHOLDS.buena) return "BUENA";
  if (margin >= LORA_SNR_MARGIN_THRESHOLDS.aceptable) return "ACEPTABLE";
  if (margin >= LORA_SNR_MARGIN_THRESHOLDS.debil) return "DEBIL";
  return "CRITICA";
};

const LEVEL_RANK: Record<LoraQualityLevel, number> = {
  EXCELENTE: 6,
  BUENA: 5,
  ACEPTABLE: 4,
  DEBIL: 3,
  CRITICA: 2,
  SIN_COBERTURA: 1,
};

export const worseOf = (
  a: LoraQualityLevel,
  b: LoraQualityLevel
): LoraQualityLevel => (LEVEL_RANK[a] <= LEVEL_RANK[b] ? a : b);

export const rssiLevel = (rssi: number): LoraQualityLevel => {
  if (rssi >= LORA_THRESHOLDS.rssi.excelente) return "EXCELENTE";
  if (rssi >= LORA_THRESHOLDS.rssi.buena) return "BUENA";
  if (rssi >= LORA_THRESHOLDS.rssi.aceptable) return "ACEPTABLE";
  if (rssi >= LORA_THRESHOLDS.rssi.debil) return "DEBIL";
  return "CRITICA";
};

export const snrLevel = (snr: number): LoraQualityLevel => {
  if (snr >= LORA_THRESHOLDS.snr.excelente) return "EXCELENTE";
  if (snr >= LORA_THRESHOLDS.snr.buena) return "BUENA";
  if (snr >= LORA_THRESHOLDS.snr.aceptable) return "ACEPTABLE";
  if (snr >= LORA_THRESHOLDS.snr.debil) return "DEBIL";
  return "CRITICA";
};

export interface LevelOfInput {
  rssi?: number | null;
  snr?: number | null;
  signal?: string | null;
  sf?: string | null;
  packetLossPct?: number | null;
}

const isValued = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

export interface NoCoverageInput {
  rssi?: number | null;
  snr?: number | null;
  signal?: string | null;
  packetLossPct?: number | null;
}

/** Muestra sin cobertura: señal Abnormal, sin RSSI/SNR o pérdida 100 %. */
export const isNoCoverageSample = (input: NoCoverageInput): boolean => {
  const { rssi, snr, signal, packetLossPct } = input;
  const abnormal = typeof signal === "string" && /abnormal/i.test(signal);
  const noValue = !isValued(rssi) && !isValued(snr);
  const totalLoss = isValued(packetLossPct) && packetLossPct >= 100;
  return abnormal || noValue || totalLoss;
};

/** Nivel combinado de una muestra: peor de RSSI/SNR + overrides. */
export const levelOf = (input: LevelOfInput): LoraQualityLevel => {
  const { rssi, snr, sf } = input;
  if (isNoCoverageSample(input)) return "SIN_COBERTURA";

  let level = worseOf(rssiLevel(rssi as number), snrLevel(snr as number));
  if (typeof sf === "string" && isValued(snr)) {
    const sfKey = sfFloorKey(sf);
    const floor = sfKey ? SNR_FLOOR_BY_SF[sfKey] : undefined;
    if (floor != null && (snr as number) < floor) {
      level = worseOf(level, "CRITICA");
    }
  }
  return level;
};

export interface LoraBucket {
  label: string;
  min: number;
  max: number;
  color: string;
  level: LoraQualityLevel;
}

// Rangos de histograma / escala por métrica derivados del baremo (web + PDF).
export const RSSI_LEVEL_BUCKETS: LoraBucket[] = [
  {
    label: "≤ -115",
    min: -Infinity,
    max: -115,
    color: LORA_LEVEL_COLOR.CRITICA,
    level: "CRITICA",
  },
  {
    label: "-115…-100",
    min: -115,
    max: -100,
    color: LORA_LEVEL_COLOR.DEBIL,
    level: "DEBIL",
  },
  {
    label: "-100…-85",
    min: -100,
    max: -85,
    color: LORA_LEVEL_COLOR.ACEPTABLE,
    level: "ACEPTABLE",
  },
  {
    label: "-85…-70",
    min: -85,
    max: -70,
    color: LORA_LEVEL_COLOR.BUENA,
    level: "BUENA",
  },
  {
    label: "> -70",
    min: -70,
    max: Infinity,
    color: LORA_LEVEL_COLOR.EXCELENTE,
    level: "EXCELENTE",
  },
];

export const SNR_LEVEL_BUCKETS: LoraBucket[] = [
  {
    label: "< -5",
    min: -Infinity,
    max: -5,
    color: LORA_LEVEL_COLOR.CRITICA,
    level: "CRITICA",
  },
  {
    label: "-5…0",
    min: -5,
    max: 0,
    color: LORA_LEVEL_COLOR.DEBIL,
    level: "DEBIL",
  },
  {
    label: "0…5",
    min: 0,
    max: 5,
    color: LORA_LEVEL_COLOR.ACEPTABLE,
    level: "ACEPTABLE",
  },
  {
    label: "5…10",
    min: 5,
    max: 10,
    color: LORA_LEVEL_COLOR.BUENA,
    level: "BUENA",
  },
  {
    label: "≥ 10",
    min: 10,
    max: Infinity,
    color: LORA_LEVEL_COLOR.EXCELENTE,
    level: "EXCELENTE",
  },
];

// Escalas fijas de leyenda por métrica (web + PDF).
export const SIGNAL_SCALE = { min: -120, max: -60 };
export const SNR_SCALE = { min: -15, max: 15 };
export const NOISE_SCALE = { min: -120, max: -80 };

// Gradiente continuo de ruido: rojo (más ruido) -> amarillo -> verde (menos ruido).
export const NOISE_GRADIENT_STOPS: [number, [number, number, number]][] = [
  [0, [220, 38, 38]],
  [0.5, [234, 179, 8]],
  [1, [34, 197, 94]],
];

export const interpolateGradient = (
  stops: [number, [number, number, number]][],
  t: number
): string => {
  const t0 = stops[0][0];
  const t1 = stops[stops.length - 1][0];
  const clamped = Math.max(t0, Math.min(t1, t));
  let i = 1;
  while (i < stops.length - 1 && clamped > stops[i][0]) i++;
  const [sa, ca] = stops[i - 1];
  const [sb, cb] = stops[i];
  const f = sa === sb ? 0 : (clamped - sa) / (sb - sa);
  const mix = (a: number, b: number) => Math.round(a + (b - a) * f);
  return `rgb(${mix(ca[0], cb[0])}, ${mix(ca[1], cb[1])}, ${mix(ca[2], cb[2])})`;
};

export const noiseGradientColor = (value: number): string => {
  const t = (value - NOISE_SCALE.min) / (NOISE_SCALE.max - NOISE_SCALE.min);
  return interpolateGradient(NOISE_GRADIENT_STOPS, t);
};
