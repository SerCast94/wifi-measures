/**
 * Motor de análisis de enlaces LoRa.
 *
 * Contiene únicamente lógica pura (baremos, clasificaciones, coherencia
 * cruzada) sin dependencias de NestJS/Prisma, para su uso tanto desde el
 * servicio de evaluación como desde el render del informe PDF.
 */

import {
  isNoCoverageSample,
  LORA_THRESHOLDS,
  rssiLevel,
  snrLevel,
  SNR_FLOOR_BY_SF,
  sfFloorKey,
} from "./lora-baremo";

export type EvalStatus = "PASS" | "WARNING" | "FAIL" | "UNKNOWN";

export interface EvaluatedMetric {
  category: string;
  metric: string;
  value: number | null;
  unit: string | null;
  status: EvalStatus;
  label: string | null;
  message: string;
  sourceLabel?: string | null;
  elementRole?: string | null;
}

export interface LoraAnalysisBlock {
  role?: string | null;
  signal?: string | null;
  totalPackets?: number | null;
  successfulPackets?: number | null;
  rssi?: number | null;
  rssis?: number | null;
  snr?: number | null;
  packetLossPct?: number | null;
  txPower?: string | null;
  longitude?: number | null;
  latitude?: number | null;
  location?: string | null;
  sourceLabel?: string | null;
}

export interface LoraAnalysisNoiseEntry {
  frequency?: number | null;
  currentScan?: number | null;
  weightedAverageScan?: number | null;
  sourceLabel?: string | null;
}

export interface LoraNoiseRecord {
  frequency?: number | null;
  currentScan?: number | null;
  weightedAverageScan?: number | null;
  sourceLabel?: string | null;
}

export interface CoherenceResult {
  case: string;
  title: string;
  status: EvalStatus;
  message: string;
  recommendation: string;
  sourceLabel?: string | null;
  elementRole?: string | null;
}

/**
 * Baremo del análisis (límites auxiliares). Las escalas de RSSI y SNR usan
 * como fuente única las funciones rssiLevel/snrLevel de lora-baremo.ts
 * (mismas fronteras que la tabla de medidas y los mapas de calor).
 */
export const LORA_BAREMO = {
  rssi: {
    excelente: LORA_THRESHOLDS.rssi.excelente,
    muyBuena: LORA_THRESHOLDS.rssi.buena,
    buena: LORA_THRESHOLDS.rssi.aceptable,
  },
  snr: {
    excelente: LORA_THRESHOLDS.snr.excelente,
    muyBuena: LORA_THRESHOLDS.snr.buena,
    buena: LORA_THRESHOLDS.snr.aceptable,
  },
  packetLoss: {
    // Pérdida de paquetes (%). El límite marca el máx. aceptado por nivel.
    // LoRa tolera más pérdidas que Wi-Fi; ajustados a realidad operativa.
    excelentePct: 2,
    muyBuenaPct: 5,
    buenaPct: 15,
    aceptablePct: 25,
    debilPct: 40,
  },
  packetConfidence: {
    // Paquetes totales para considerar la muestra fiable.
    low: 30,
    preliminary: 100,
  },
  noise: {
    // Elevación del scan actual sobre la media ponderada (dB) por nivel.
    excelente: 3,
    buena: 6,
    aceptable: 10,
    debil: 15,
  },
  noiseCategory: {
    "[860-865]": "SGM 860-865",
    "[868-870]": "SGM 868-870",
    "[870-876]": "SGM 870-876",
    "[890-900]": "SGM 890-900",
    "[902-928]": "SGM 902-928",
    "[915-922]": "SGM 915-922",
    "[928-938]": "SGM 928-938",
    "[940-960]": "SGM 940-960",
  },
  margin: {
    // Margen LoRa real = SNR medido - piso teórico del SF (dB).
    // LoRa demodula bajo el ruido; el margen RSSI-ruido NO es representativo.
    excelente: 10,
    buena: 5,
    aceptable: 0,
    debil: -5,
  },
  rssis: {
    // Diferencia |RSSI - RSSI senoidal| para considerar la muestra fiable.
    consistente: 6,
    sospechosa: 15,
  },
  ackRate: {
    // Tasa de confirmación (confirm/uplink) aceptada por nivel.
    buena: 80,
    aceptable: 60,
  },
  txPower: {
    // Potencia de transmisión (dBm) — márgenes orientativos.
    adecuada: 10,
  },
} as const;

const fmt = (value: number | null, digits = 0): string =>
  value === null || value === undefined || Number.isNaN(Number(value))
    ? "—"
    : Number(value).toFixed(digits);

// ---------- Clasificaciones individuales ----------

const packetLossLevel = (pct: number): string => {
  if (pct <= LORA_BAREMO.packetLoss.excelentePct) return "EXCELENTE";
  if (pct <= LORA_BAREMO.packetLoss.muyBuenaPct) return "MUY BUENA";
  if (pct <= LORA_BAREMO.packetLoss.buenaPct) return "BUENA";
  if (pct <= LORA_BAREMO.packetLoss.aceptablePct) return "ACEPTABLE";
  if (pct <= LORA_BAREMO.packetLoss.debilPct) return "DÉBIL";
  return "CRÍTICA";
};

const noiseDeltaLevel = (delta: number): string => {
  if (delta <= LORA_BAREMO.noise.excelente) return "EXCELENTE";
  if (delta <= LORA_BAREMO.noise.buena) return "BUENA";
  if (delta <= LORA_BAREMO.noise.aceptable) return "ACEPTABLE";
  if (delta <= LORA_BAREMO.noise.debil) return "DÉBIL";
  return "CRÍTICA";
};

const marginLevel = (margin: number): string => {
  if (margin >= LORA_BAREMO.margin.excelente) return "EXCELENTE";
  if (margin >= LORA_BAREMO.margin.buena) return "BUENA";
  if (margin >= LORA_BAREMO.margin.aceptable) return "ACEPTABLE";
  if (margin >= LORA_BAREMO.margin.debil) return "DÉBIL";
  return "CRÍTICO";
};

const levelToStatus = (
  level: string,
  ok: string[],
  warn: string[]
): EvalStatus => {
  if (ok.includes(level)) return "PASS";
  if (warn.includes(level)) return "WARNING";
  return "FAIL";
};

const RSSI_OK = ["EXCELENTE", "BUENA"];
const RSSI_WARN = ["ACEPTABLE"];
const SNR_OK = ["EXCELENTE", "BUENA"];
const SNR_WARN = ["ACEPTABLE"];
const LOSS_OK = ["EXCELENTE", "MUY BUENA"];
const LOSS_WARN = ["BUENA", "ACEPTABLE"];
const DELTA_OK = ["EXCELENTE", "BUENA"];
const DELTA_WARN = ["ACEPTABLE"];
const MARGIN_OK = ["EXCELENTE", "BUENA"];
const MARGIN_WARN = ["ACEPTABLE"];

// ---------- Métricas por bloque (Master/Slave) ----------

const composeOrigin = (
  source?: string | null,
  role?: string | null
): string => {
  const parts = [source, role].filter(
    (p) => typeof p === "string" && p.trim().length > 0
  );
  return parts.length ? `${parts.join(" · ")}: ` : "";
};

export function evaluateRssi(
  rssi: number | null | undefined,
  role?: string,
  sourceLabel?: string | null
): EvaluatedMetric {
  const origin = composeOrigin(sourceLabel, role);
  const value = rssi === null || rssi === undefined ? null : Number(rssi);
  if (value === null || Number.isNaN(value)) {
    return {
      category: "RADIO",
      metric: "RSSI",
      value: null,
      unit: "dBm",
      status: "UNKNOWN",
      label: null,
      sourceLabel: sourceLabel ?? null,
      elementRole: role ?? null,
      message: `${origin}RSSI sin dato capturado.`,
    };
  }
  const level = rssiLevel(value);
  return {
    category: "RADIO",
    metric: "RSSI",
    value,
    unit: "dBm",
    status: levelToStatus(level, RSSI_OK, RSSI_WARN),
    label: level,
    sourceLabel: sourceLabel ?? null,
    elementRole: role ?? null,
    message: `${origin}RSSI ${value.toFixed(0)} dBm → ${level}.`,
  };
}

export function evaluateSnr(
  snr: number | null | undefined,
  role?: string,
  sourceLabel?: string | null
): EvaluatedMetric {
  const origin = composeOrigin(sourceLabel, role);
  const value = snr === null || snr === undefined ? null : Number(snr);
  if (value === null || Number.isNaN(value)) {
    return {
      category: "RADIO",
      metric: "SNR",
      value: null,
      unit: "dB",
      status: "UNKNOWN",
      label: null,
      sourceLabel: sourceLabel ?? null,
      elementRole: role ?? null,
      message: `${origin}SNR sin dato capturado.`,
    };
  }
  const level = snrLevel(value);
  return {
    category: "RADIO",
    metric: "SNR",
    value,
    unit: "dB",
    status: levelToStatus(level, SNR_OK, SNR_WARN),
    label: level,
    sourceLabel: sourceLabel ?? null,
    elementRole: role ?? null,
    message: `${origin}SNR ${value.toFixed(1)} dB → ${level}.`,
  };
}

export function evaluatePacketLoss(
  block: LoraAnalysisBlock,
  role?: string
): EvaluatedMetric {
  const origin = composeOrigin(block.sourceLabel, role);
  const total = block.totalPackets ?? null;
  const lossPct =
    block.packetLossPct === null || block.packetLossPct === undefined
      ? null
      : Number(block.packetLossPct);
  const totalN = total === null ? null : Number(total);

  if (lossPct === null || Number.isNaN(lossPct) || totalN === null) {
    return {
      category: "PAQUETES",
      metric: "PACKET_LOSS",
      value: lossPct,
      unit: "%",
      status: "UNKNOWN",
      label: null,
      sourceLabel: block.sourceLabel ?? null,
      elementRole: role ?? null,
      message: `${origin}Pérdida de paquetes sin dato (necesita total y % de pérdida).`,
    };
  }

  const level = packetLossLevel(lossPct);
  let message = `${origin}Pérdida ${lossPct.toFixed(1)}% sobre ${totalN} paquetes → ${level}.`;
  const confidence =
    totalN < LORA_BAREMO.packetConfidence.low
      ? "baja"
      : totalN < LORA_BAREMO.packetConfidence.preliminary
        ? "preliminar"
        : "alta";
  if (confidence !== "alta") {
    message += ` Confianza ${confidence} (muestra reducida).`;
  }
  return {
    category: "PAQUETES",
    metric: "PACKET_LOSS",
    value: lossPct,
    unit: "%",
    status: levelToStatus(level, LOSS_OK, LOSS_WARN),
    label: level,
    sourceLabel: block.sourceLabel ?? null,
    elementRole: role ?? null,
    message,
  };
}

export function evaluateMargin(
  block: LoraAnalysisBlock,
  _noiseFloor: number | null,
  role?: string
): EvaluatedMetric {
  const origin = composeOrigin(block.sourceLabel, role);
  const snr =
    block.snr === null || block.snr === undefined ? null : Number(block.snr);
  const sfValue = (block as any).sf ?? null;

  if (snr === null || Number.isNaN(snr)) {
    return {
      category: "MARGEN",
      metric: "MARGIN",
      value: null,
      unit: "dB",
      status: "UNKNOWN",
      label: null,
      sourceLabel: block.sourceLabel ?? null,
      elementRole: role ?? null,
      message: `${origin}Margen LoRa (SNR - piso SF) sin dato: SNR no disponible.`,
    };
  }

  const sfKey = sfFloorKey(sfValue);
  const floor = sfKey ? SNR_FLOOR_BY_SF[sfKey] ?? -20 : -20;
  const margin = snr - floor;
  const level = marginLevel(margin);
  return {
    category: "MARGEN",
    metric: "MARGIN",
    value: Math.round(margin * 100) / 100,
    unit: "dB",
    status: levelToStatus(level, MARGIN_OK, MARGIN_WARN),
    label: level,
    sourceLabel: block.sourceLabel ?? null,
    elementRole: role ?? null,
    message: `${origin}Margen LoRa ${margin.toFixed(1)} dB (SNR ${snr.toFixed(1)} − piso ${sfKey ?? "?"} ${floor} dB) → ${level}.`,
  };
}

const numOf = (value: unknown): number | null =>
  value === null || value === undefined || Number.isNaN(Number(value))
    ? null
    : Number(value);

export function evaluateRssisConsistency(
  block: LoraAnalysisBlock,
  role?: string
): EvaluatedMetric | null {
  const origin = composeOrigin(block.sourceLabel, role);
  const rssi = numOf(block.rssi);
  const rssis = numOf(block.rssis);

  // Solo RSSI: ya lo evalúa evaluateRssi.
  if (rssi !== null && rssis === null) return null;
  if (rssi === null && rssis === null) return null;

  if (rssi !== null && rssis !== null) {
    const gap = Math.abs(rssi - rssis);
    const status =
      gap <= LORA_BAREMO.rssis.consistente
        ? "PASS"
        : gap <= LORA_BAREMO.rssis.sospechosa
          ? "WARNING"
          : "FAIL";
    return {
      category: "RADIO",
      metric: "RSSI_SENOIDAL",
      value: Math.round(gap * 100) / 100,
      unit: "dB",
      status,
      label: null,
      sourceLabel: block.sourceLabel ?? null,
      elementRole: role ?? null,
      message:
        status === "PASS"
          ? `${origin}RSSI ${rssi.toFixed(0)} dBm y RSSI senoidal ${rssis.toFixed(0)} dBm coherentes (Δ ${gap.toFixed(1)} dB).`
          : `${origin}RSSI ${rssi.toFixed(0)} dBm frente a RSSI senoidal ${rssis.toFixed(0)} dBm (Δ ${gap.toFixed(1)} dB): discrepancia ${status === "FAIL" ? "significativa" : "a vigilar"}; revisa calibrado o receptor.`,
    };
  }

  // Fallback: falta RSSI principal, se valora con el senoidal.
  const level = rssiLevel(rssis as number);
  return {
    category: "RADIO",
    metric: "RSSI_SENOIDAL",
    value: rssis,
    unit: "dBm",
    status: levelToStatus(level, RSSI_OK, RSSI_WARN),
    label: level,
    sourceLabel: block.sourceLabel ?? null,
    elementRole: role ?? null,
    message: `${origin}RSSI principal sin dato; valorado con RSSI senoidal ${(rssis as number).toFixed(0)} dBm → ${level}.`,
  };
}

export function evaluateAckRate(
  block: LoraAnalysisBlock,
  role?: string
): EvaluatedMetric | null {
  const origin = composeOrigin(block.sourceLabel, role);
  const total = numOf(block.totalPackets);
  const ack = numOf(block.successfulPackets);
  if (total === null || ack === null || total <= 0) return null;
  const pct = Math.min(100, Math.round((ack / total) * 1000) / 10);
  const status =
    pct >= LORA_BAREMO.ackRate.buena
      ? "PASS"
      : pct >= LORA_BAREMO.ackRate.aceptable
        ? "WARNING"
        : "FAIL";
  return {
    category: "PAQUETES",
    metric: "ACK_RATE",
    value: pct,
    unit: "%",
    status,
    label:
      status === "PASS"
        ? "BUENA"
        : status === "WARNING"
          ? "ACEPTABLE"
          : "DEBIL",
    sourceLabel: block.sourceLabel ?? null,
    elementRole: role ?? null,
    message: `${origin}Confirmación de ${ack}/${total} paquetes (${pct.toFixed(1)}%)${status === "PASS" ? "." : "; revisa el gateway/ACK en la red."}`,
  };
}

export function evaluateTxPower(
  block: LoraAnalysisBlock,
  role?: string
): EvaluatedMetric | null {
  const origin = composeOrigin(block.sourceLabel, role);
  const raw = block.txPower;
  const match =
    raw === null || raw === undefined
      ? null
      : String(raw).match(/-?\d+(\.\d+)?/);
  if (!match) return null;
  const tx = Number(match[0]);
  if (!Number.isFinite(tx)) return null;
  const status =
    tx >= LORA_BAREMO.txPower.adecuada ? "PASS" : tx > 0 ? "WARNING" : "FAIL";
  const label =
    status === "PASS" ? "ADECUADA" : status === "WARNING" ? "BAJA" : "CRITICA";
  return {
    category: "RADIO",
    metric: "TX_POWER",
    value: tx,
    unit: "dBm",
    status,
    label,
    sourceLabel: block.sourceLabel ?? null,
    elementRole: role ?? null,
    message:
      status === "PASS"
        ? `${origin}Potencia de transmisión ${tx.toFixed(0)} dBm adecuada para el enlace.`
        : status === "WARNING"
          ? `${origin}Potencia de transmisión baja (${tx.toFixed(0)} dBm); margen de enlace reducido.`
          : `${origin}Potencia de transmisión crítica (${tx.toFixed(0)} dBm); sin margen operativo.`,
  };
}

// ---------- Ruido (por entrada de frecuencia) ----------

export function noiseCategoryLabel(frequency: number): string {
  for (const [range, label] of Object.entries(LORA_BAREMO.noiseCategory)) {
    const [a, b] = range.slice(1, -1).split("-").map(Number);
    if (frequency >= a && frequency <= b) return label;
  }
  return `${frequency.toFixed(0)} MHz`;
}

/**
 * Agrega el ruido por banda: varios scans (registros) repiten las mismas
 * frecuencias/bandas; se queda con la peor elevación de cada banda en vez de
 * emitir una fila por entrada (evita duplicidades).
 */
export function evaluateNoiseBand(
  band: string,
  entries: LoraNoiseRecord[]
): EvaluatedMetric {
  const ranked = entries
    .map((entry) => {
      const current = numOf(entry.currentScan);
      const weighted = numOf(entry.weightedAverageScan);
      return {
        entry,
        current,
        weighted,
        delta: current !== null && weighted !== null ? current - weighted : null,
      };
    })
    .filter((r) => r.current !== null && r.weighted !== null);

  if (ranked.length === 0) {
    return {
      category: "RUIDO",
      metric: "NOISE_DELTA",
      value: null,
      unit: "dBm",
      status: "UNKNOWN",
      label: null,
      sourceLabel: band,
      elementRole: null,
      message: `${band}: ruido de scan no disponible (falta scan actual o media ponderada).`,
    };
  }

  ranked.sort((a, b) => (b.delta as number) - (a.delta as number));
  const worst = ranked[0];
  const delta = worst.delta as number;
  const level = noiseDeltaLevel(delta);
  return {
    category: "RUIDO",
    metric: "NOISE_DELTA",
    value: Math.round(delta * 100) / 100,
    unit: "dB",
    status: levelToStatus(level, DELTA_OK, DELTA_WARN),
    label: level,
    sourceLabel: band,
    elementRole: null,
    message: `${band}: ruido actual ${worst.current?.toFixed(0)} dBm vs media ${worst.weighted?.toFixed(0)} dBm (Δ ${delta.toFixed(1)} dB, peor de ${ranked.length} scan${ranked.length === 1 ? "" : "s"}) → ${level}.`,
  };
}

export function evaluateNoiseEntry(entry: LoraNoiseRecord): EvaluatedMetric {
  const current =
    entry.currentScan === null || entry.currentScan === undefined
      ? null
      : Number(entry.currentScan);
  const weighted =
    entry.weightedAverageScan === null ||
    entry.weightedAverageScan === undefined
      ? null
      : Number(entry.weightedAverageScan);
  const freq = entry.frequency ?? null;

  const category =
    freq !== null && !Number.isNaN(freq)
      ? noiseCategoryLabel(Number(freq))
      : "RUIDO";
  const origin = composeOrigin(entry.sourceLabel, category);

  if (current === null || Number.isNaN(current) || weighted === null) {
    return {
      category: "RUIDO",
      metric: "NOISE_DELTA",
      value: current,
      unit: "dBm",
      status: "UNKNOWN",
      label: null,
      sourceLabel: entry.sourceLabel ?? null,
      elementRole: category,
      message: `${origin}ruido de scan no disponible (falta scan actual o media ponderada).`,
    };
  }

  const deltaBm = current - weighted; // elevación (más positivo = más ruido que la media)
  const level = noiseDeltaLevel(deltaBm);
  return {
    category: "RUIDO",
    metric: "NOISE_DELTA",
    value: Math.round(deltaBm * 100) / 100,
    unit: "dB",
    status: levelToStatus(level, DELTA_OK, DELTA_WARN),
    label: level,
    sourceLabel: entry.sourceLabel ?? null,
    elementRole: category,
    message: `${origin}ruido actual ${current.toFixed(0)} dBm vs media ${weighted.toFixed(0)} dBm (Δ ${deltaBm.toFixed(1)} dB) → ${level}.`,
  };
}

export function highestNoiseFloor(entries: LoraNoiseRecord[]): number | null {
  let max = -Infinity;
  let found = false;
  for (const entry of entries) {
    const current =
      entry.currentScan === null || entry.currentScan === undefined
        ? null
        : Number(entry.currentScan);
    if (current !== null && !Number.isNaN(current) && current > max) {
      max = current;
      found = true;
    }
  }
  return found ? max : null;
}

// ---------- Coherencia cruzada (casos A–F) ----------

export function coherenceAnalysis(
  block: LoraAnalysisBlock,
  _noiseFloor: number | null
): CoherenceResult {
  const rssi =
    block.rssi === null || block.rssi === undefined ? null : Number(block.rssi);
  const snr =
    block.snr === null || block.snr === undefined ? null : Number(block.snr);
  const lossPct =
    block.packetLossPct === null || block.packetLossPct === undefined
      ? null
      : Number(block.packetLossPct);
  const totalPackets =
    block.totalPackets === null || block.totalPackets === undefined
      ? null
      : Number(block.totalPackets);
  const sf = (block as any).sf ?? null;

  const rssiOk =
    rssi !== null && !Number.isNaN(rssi) && rssi >= LORA_BAREMO.rssi.buena;
  const snrOk =
    snr !== null && !Number.isNaN(snr) && snr >= LORA_BAREMO.snr.buena;
  const lossOk =
    lossPct !== null &&
    !Number.isNaN(lossPct) &&
    lossPct <= LORA_BAREMO.packetLoss.buenaPct;

  // Margen LoRa real = SNR - piso teórico del SF
  const sfKey = sfFloorKey(sf);
  const floor = sfKey ? SNR_FLOOR_BY_SF[sfKey] ?? -20 : -20;
  const snrMargin = snr !== null && !Number.isNaN(snr) ? snr - floor : null;
  const marginOk =
    snrMargin !== null && snrMargin >= LORA_BAREMO.margin.aceptable;

  const hasSample =
    totalPackets !== null &&
    !Number.isNaN(totalPackets) &&
    totalPackets >= LORA_BAREMO.packetConfidence.low;

  const noData = rssi === null && snr === null && lossPct === null;
  if (noData) {
    return {
      case: "—",
      title: "Sin datos suficientes",
      status: "UNKNOWN",
      message:
        "No hay métricas de bloque para evaluar la coherencia del enlace.",
      recommendation:
        "Comprueba que la medida contiene datos de radio y paquetes.",
    };
  }

  // Métrica claramente discordante respecto al resto (buena señal pero
  // pérdidas altas, o señal débil con pérdidas nulas).
  const goodSignals = (rssiOk ? 1 : 0) + (snrOk ? 1 : 0);
  const signalConsistent = goodSignals >= 1 || (!rssiOk && !snrOk);
  const lossAgainstSignal =
    signalConsistent && goodSignals >= 1 && !lossOk && lossPct !== null;
  const lossAgainstWeak = !rssiOk && !snrOk && lossOk && lossPct !== null;

  if (lossAgainstSignal) {
    return {
      case: "F",
      title: "Pérdidas anómalas con buena señal",
      status: "FAIL",
      message: `Señal correcta (RSSI ${fmt(rssi)} dBm, SNR ${fmt(snr, 1)} dB) pero pérdida de ${fmt(lossPct, 1)}%.`,
      recommendation:
        "Revisa interferencias o saturación en la estación/red; verifica el gateway y el SF utilizado.",
    };
  }
  if (lossAgainstWeak) {
    return {
      case: "E",
      title: "Señal débil sin pérdidas",
      status: "WARNING",
      message: `Señal débil (RSSI ${fmt(rssi)} dBm, SNR ${fmt(snr, 1)} dB) pero sin pérdidas registradas.`,
      recommendation:
        "Confirma la escala de señal; si es real, el enlace es frágil y debería reforzarse la cobertura.",
    };
  }
  if (rssiOk && snrOk && lossOk && marginOk) {
    return {
      case: "A",
      title: "Caso coherente / correcto",
      status: "PASS",
      message: `RSSI ${fmt(rssi)} dBm, SNR ${fmt(snr, 1)} dB, pérdida ${fmt(lossPct, 1)}% y margen radio adecuado: parámetros coherentes.`,
      recommendation: "No se requiere actuación para esta muestra.",
    };
  }
  if ((!rssiOk || !snrOk) && lossOk) {
    return {
      case: "B",
      title: "Señal límite con buena entrega",
      status: "WARNING",
      message: `Señal en la frontera (RSSI ${fmt(rssi)} dBm, SNR ${fmt(snr, 1)} dB) aunque la entrega de paquetes es correcta.`,
      recommendation:
        "Vigila la cobertura; la pérdida de margen puede degradar el enlace con el tiempo.",
    };
  }
  if (rssiOk && snrOk && !lossOk) {
    return {
      case: "C",
      title: "Señal correcta con pérdidas elevadas",
      status: "WARNING",
      message: `Buena señal (RSSI ${fmt(rssi)} dBm, SNR ${fmt(snr, 1)} dB) pero pérdida de ${fmt(lossPct, 1)}%.`,
      recommendation:
        "Investiga la causa de las pérdidas (colisiones, SF compartido, dispositivo remoto).",
    };
  }
  if (!rssiOk && !snrOk && !lossOk) {
    return {
      case: "D",
      title: "Enlace degradado",
      status: "FAIL",
      message: `Señal y entrega degradadas (RSSI ${fmt(rssi)} dBm, SNR ${fmt(snr, 1)} dB, pérdida ${fmt(lossPct, 1)}%).`,
      recommendation:
        "Reubica/refuerza el nodo, revisa antenas y el SF antes de dar el enlace por válido.",
    };
  }
  return {
    case: "B",
    title: "Sin valoración concluyente",
    status: hasSample ? "WARNING" : "UNKNOWN",
    message: "Parámetros parciales; revisa la muestra y vuelve a analizar.",
    recommendation: "Amplía la muestra de paquetes para un diagnóstico fiable.",
  };
}

// ---------- Resumen global ----------

export interface AnalysisSummary {
  total: number;
  byStatus: Record<EvalStatus, number>;
  pctPass: number;
  globalResult: string;
  paragraphs: string[];
  recommendations: string[];
}

const MEASURE_RE = /^Medida\s+(\d+)/;
const measureNumber = (label: string | null | undefined): number | null => {
  const match = label ? String(label).match(MEASURE_RE) : null;
  return match ? Number(match[1]) : null;
};

const valued = (values: Array<number | null | undefined>): number[] =>
  values.filter((v): v is number => v != null && Number.isFinite(Number(v)));

const avgOf = (values: number[]): number | null =>
  values.length
    ? Math.round((values.reduce((s, v) => s + v, 0) / values.length) * 10) / 10
    : null;

const minOf = (values: number[]): number | null =>
  values.length ? Math.min(...values) : null;

interface MeasureSignalStats {
  muestras: number;
  rssiMin: number | null;
  snrAvg: number | null;
  lossAvg: number | null;
  ackPct: number | null;
  pktAvg: number | null;
}

/** Estadísticas de señal/paquetes promediadas por medida. */
function measureStats(blocks: LoraAnalysisBlock[]): MeasureSignalStats {
  const rssi = valued(blocks.map((b) => b.rssi));
  const snr = valued(blocks.map((b) => b.snr));
  const loss = valued(blocks.map((b) => b.packetLossPct));
  const total = valued(blocks.map((b) => b.totalPackets));
  const ok = valued(blocks.map((b) => b.successfulPackets));
  const sumTot = total.reduce((s, v) => s + v, 0);
  const sumOk = ok.reduce((s, v) => s + v, 0);
  return {
    muestras: blocks.length,
    rssiMin: minOf(rssi),
    snrAvg: avgOf(snr),
    lossAvg: avgOf(loss),
    ackPct: sumTot > 0 ? Math.round((sumOk / sumTot) * 1000) / 10 : null,
    pktAvg:
      total.length > 0 ? Math.round((sumTot / total.length) * 10) / 10 : null,
  };
}

const METRIC_SHORT_LABEL: Record<string, string> = {
  RSSI: "RSSI",
  SNR: "SNR",
  PACKET_LOSS: "pérdida de paquetes",
  ACK_RATE: "acuses",
  MARGIN: "margen",
  COHERENCIA: "coherencia cruzada",
  RSSI_SENOIDAL: "RSSI senoidal",
};

/** Recomendaciones por medida: una por medida afectada, no por muestra. */
function measureRecommendations(
  evaluations: EvaluatedMetric[],
  blocks: LoraAnalysisBlock[]
): string[] {
  const byMeasure = new Map<string, EvaluatedMetric[]>();
  for (const e of evaluations) {
    if (!e.sourceLabel || measureNumber(e.sourceLabel) === null) continue;
    if (!byMeasure.has(e.sourceLabel)) byMeasure.set(e.sourceLabel, []);
    byMeasure.get(e.sourceLabel)!.push(e);
  }

  const ordered = [...byMeasure.entries()].sort(
    ([a], [b]) => (measureNumber(a) ?? 0) - (measureNumber(b) ?? 0)
  );

  const recommendations: string[] = [];
  for (const [sourceLabel, evals] of ordered) {
    const fails = evals.filter((e) => e.status === "FAIL");
    if (fails.length === 0) continue;

    const muestrasSet = new Set(
      evals.map((e) => e.elementRole).filter((r): r is string => Boolean(r))
    );
    const muestras =
      muestrasSet.size > 0
        ? muestrasSet.size
        : fails.find((e) => e.metric === "COBERTURA")?.value ?? fails.length;

    const coverage = fails.find((e) => e.metric === "COBERTURA");
    if (coverage) {
      recommendations.push(
        `${sourceLabel}: sin cobertura en ${coverage.value ?? muestras} muestra${coverage.value === 1 ? "" : "s"}. Verifica que el dispositivo transmite y el gateway recibe en esa ubicación y repite la medición.`
      );
      continue;
    }

    const stats = measureStats(
      blocks.filter((b) => (b.sourceLabel ?? null) === sourceLabel)
    );
    const detail: string[] = [];
    if (stats.rssiMin != null) detail.push(`RSSI ≈ ${stats.rssiMin} dBm`);
    if (stats.snrAvg != null) detail.push(`SNR ≈ ${stats.snrAvg} dB`);
    if (stats.lossAvg != null) detail.push(`pérdida media ${stats.lossAvg}%`);
    if (stats.ackPct != null) detail.push(`acuses ${stats.ackPct}%`);
    const metrics = Array.from(
      new Set(fails.map((e) => METRIC_SHORT_LABEL[e.metric] ?? e.metric))
    ).join(", ");

    // Solo señal débil (sin pérdidas ni fallos de paquetes): no se degradó la
    // entrega, pero el margen de radio es precario.
    const radioOnly = fails.every((e) =>
      ["RSSI", "SNR", "MARGIN", "RSSI_SENOIDAL", "COHERENCIA"].includes(
        e.metric
      )
    );
    const noPacketLoss =
      stats.lossAvg != null && stats.lossAvg < 2 &&
      stats.ackPct != null && stats.ackPct >= 99;
    const basis = detail.length > 0 ? detail.join(", ") : metrics;

    let message =
      radioOnly && noPacketLoss && stats.rssiMin != null
        ? `${sourceLabel}: señal débil en ${muestras} muestra${muestras === 1 ? "" : "s"} (${basis}) sin pérdidas registradas; el enlace entrega pero es frágil, vigila la cobertura y refuerza el punto si degrada.`
        : `${sourceLabel}: enlace degradado en ${muestras} muestra${muestras === 1 ? "" : "s"} (${basis}); reubica o refuerza el nodo y revisa antenas/SF antes de validar.`;
    if (
      stats.pktAvg != null &&
      stats.pktAvg < LORA_BAREMO.packetConfidence.low
    ) {
      message += ` Muestras reducidas (media ${stats.pktAvg} paquete${stats.pktAvg === 1 ? "" : "s"}/muestra); repite con ≥${LORA_BAREMO.packetConfidence.low} paquetes para confirmar.`;
    }
    recommendations.push(message);
  }
  return recommendations;
}

export function summarizeAnalysis(
  evaluations: EvaluatedMetric[],
  blocks: LoraAnalysisBlock[] = []
): AnalysisSummary {
  const byStatus: Record<EvalStatus, number> = {
    PASS: 0,
    WARNING: 0,
    FAIL: 0,
    UNKNOWN: 0,
  };
  for (const e of evaluations) {
    byStatus[e.status] += 1;
  }
  const meaningful = evaluations.length - byStatus.UNKNOWN;
  const pctPass =
    meaningful > 0 ? Math.round((byStatus.PASS / meaningful) * 100) : 0;

  const globalResult =
    meaningful === 0
      ? "SIN_DATOS_SUFICIENTES"
      : byStatus.FAIL > 0
        ? "NO_CONFORME"
        : byStatus.WARNING > 0
          ? "APROBADO_CON_OBSERVACIONES"
          : "APROBADO";

  const paragraphs: string[] = [];
  if (meaningful > 0) {
    paragraphs.push(
      `Se evaluaron ${meaningful} condiciones: ${byStatus.PASS} conformes (${pctPass}%), ` +
        `${byStatus.WARNING} en el límite y ${byStatus.FAIL} no conformes.`
    );
    if (byStatus.FAIL > 0) {
      paragraphs.push(
        "Existen condiciones no conformes que deben revisarse antes de la puesta en servicio del enlace LoRa."
      );
    } else if (byStatus.WARNING > 0) {
      paragraphs.push(
        "No hay incumplimientos graves; se recomienda atender las condiciones en el límite para ganar margen operativo."
      );
    } else {
      paragraphs.push(
        "Los parámetros del enlace cumplen los criterios de aceptación definidos."
      );
    }
  } else {
    paragraphs.push(
      "No hay datos evaluables suficientes para emitir un diagnóstico. Carga medida y ruido y vuelve a ejecutar el análisis."
    );
  }

  const recommendations: string[] = measureRecommendations(evaluations, blocks);
  const warns = evaluations.filter((e) => e.status === "WARNING").length;
  if (warns > 0) {
    recommendations.push(
      `Revisa las ${warns} condición(es) en el límite para evitar degradación operativa.`
    );
  }
  if (byStatus.FAIL > 0 && recommendations.length === 0) {
    recommendations.push(
      `Corrige las ${byStatus.FAIL} condición(es) no conforme(s) señaladas en el análisis (RSSI/SNR/pérdidas/margen/ruido).`
    );
  }
  if (recommendations.length === 0 && meaningful > 0) {
    recommendations.push(
      "El enlace analizado cumple los criterios definidos; mantener el SF y los niveles actuales."
    );
  }

  return {
    total: evaluations.length,
    byStatus,
    pctPass,
    globalResult,
    paragraphs,
    recommendations: recommendations.filter(Boolean),
  };
}

// ---------- Orquestador ----------

const blockWithoutCoverage = (block: LoraAnalysisBlock): boolean =>
  isNoCoverageSample({
    rssi: block.rssi,
    snr: block.snr,
    signal: block.signal,
    packetLossPct: block.packetLossPct,
  });

/**
 * Agrega una medida 100 % sin cobertura: una única condición COBERTURA por
 * medida (con el número de muestras afectadas) en lugar de una fila por
 * muestra del mismo hecho.
 */
function evaluateNoCoverage(
  sourceLabel: string | null,
  blocks: LoraAnalysisBlock[]
): EvaluatedMetric {
  const count = blocks.length;
  const allAbnormal = blocks.every(
    (b) => typeof b.signal === "string" && /abnormal/i.test(b.signal)
  );
  const allLost = blocks.every(
    (b) => b.packetLossPct != null && Number(b.packetLossPct) >= 100
  );
  const allNoRadio = blocks.every(
    (b) =>
      (b.rssi == null || Number.isNaN(Number(b.rssi))) &&
      (b.snr == null || Number.isNaN(Number(b.snr)))
  );
  const reason = allAbnormal
    ? "señal Abnormal"
    : allLost
      ? "100 % de pérdida"
      : allNoRadio
        ? "sin datos de radio válidos"
        : "sin enlace";
  const origin = sourceLabel ? `${sourceLabel}: ` : "";
  return {
    category: "COBERTURA",
    metric: "COBERTURA",
    value: count,
    unit: "muestras",
    status: "FAIL",
    label: "SIN_COBERTURA",
    sourceLabel,
    elementRole: null,
    message: `${origin}Sin cobertura en ${count} ${count === 1 ? "muestra" : "muestras"} (${reason}): no se estableció enlace en el punto; verifica que el dispositivo transmite y el gateway recibe, y repite la medición.`,
  };
}

export function analyzeLora(
  blocks: LoraAnalysisBlock[],
  noiseEntries: LoraNoiseRecord[]
): { evaluations: EvaluatedMetric[]; coherence: CoherenceResult[] } {
  const evaluations: EvaluatedMetric[] = [];
  const coherence: CoherenceResult[] = [];
  const noiseFloor = highestNoiseFloor(noiseEntries);

  // Ruido agregado por banda (varios scans repiten las mismas frecuencias)
  const noiseByBand = new Map<string, LoraNoiseRecord[]>();
  for (const entry of noiseEntries) {
    const freq = numOf(entry.frequency);
    const label = freq !== null ? noiseCategoryLabel(freq) : "RUIDO";
    if (!noiseByBand.has(label)) noiseByBand.set(label, []);
    noiseByBand.get(label)!.push(entry);
  }
  for (const [band, entries] of noiseByBand) {
    evaluations.push(evaluateNoiseBand(band, entries));
  }

  // Métricas por bloque (Master/Slave), agrupadas por medida: si TODAS las
  // muestras de una medida carecen de cobertura, se resume en una única
  // condición COBERTURA por medida (evita una fila por muestra del mismo
  // hecho).
  const byMeasure = new Map<string | null, LoraAnalysisBlock[]>();
  for (const block of blocks) {
    const key = block.sourceLabel ?? null;
    if (!byMeasure.has(key)) byMeasure.set(key, []);
    byMeasure.get(key)!.push(block);
  }

  for (const measureBlocks of byMeasure.values()) {
    const entirelyWithoutCoverage =
      measureBlocks.length > 0 &&
      measureBlocks.every((block) => blockWithoutCoverage(block));

    if (entirelyWithoutCoverage) {
      evaluations.push(
        evaluateNoCoverage(measureBlocks[0].sourceLabel ?? null, measureBlocks)
      );
      for (const block of measureBlocks) {
        const txMetric = evaluateTxPower(
          block,
          block.role ? String(block.role) : undefined
        );
        if (txMetric) evaluations.push(txMetric);
      }
      continue;
    }

    for (const block of measureBlocks) {
      const label = block.role ? String(block.role) : undefined;
      const origin = composeOrigin(block.sourceLabel, label);

      evaluations.push(evaluateRssi(block.rssi, label, block.sourceLabel));
      evaluations.push(evaluateSnr(block.snr, label, block.sourceLabel));
      evaluations.push(evaluatePacketLoss(block, label));
      evaluations.push(evaluateMargin(block, noiseFloor, label));

      const rssisMetric = evaluateRssisConsistency(block, label);
      if (rssisMetric) evaluations.push(rssisMetric);
      const ackMetric = evaluateAckRate(block, label);
      if (ackMetric) evaluations.push(ackMetric);
      const txMetric = evaluateTxPower(block, label);
      if (txMetric) evaluations.push(txMetric);

      const coherenceResult = coherenceAnalysis(block, noiseFloor);
      coherence.push({
        ...coherenceResult,
        sourceLabel: block.sourceLabel ?? null,
        elementRole: label ?? null,
      });
      evaluations.push({
        category: "COHERENCIA",
        metric: "COHERENCIA",
        value: null,
        unit: null,
        status: coherenceResult.status,
        sourceLabel: block.sourceLabel ?? null,
        elementRole: label ?? null,
        label:
          coherenceResult.case === "—" ? null : `Caso ${coherenceResult.case}`,
        message: `${origin}${coherenceResult.title}. ${coherenceResult.message}`,
      });
    }
  }

  return { evaluations, coherence };
}
