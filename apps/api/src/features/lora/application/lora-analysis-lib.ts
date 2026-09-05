/**
 * Motor de análisis de enlaces LoRa.
 *
 * Contiene únicamente lógica pura (baremos, clasificaciones, coherencia
 * cruzada) sin dependencias de NestJS/Prisma, para su uso tanto desde el
 * servicio de evaluación como desde el render del informe PDF.
 */

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
  totalPackets?: number | null;
  successfulPackets?: number | null;
  rssi?: number | null;
  snr?: number | null;
  packetLossPct?: number | null;
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
}

/**
 * Baremo aplicado (límites). Se definen aquí como fuente única y ajustable:
 * el límite marca la frontera inferior de cada nivel.
 */
export const LORA_BAREMO = {
  rssi: {
    // RSSI recibido (dBm). Valores más próximos a 0 = mejor señal.
    excelente: -70,
    muyBuena: -85,
    buena: -95,
    aceptable: -105,
    debil: -115,
  },
  snr: {
    // Relación señal/ruido (dB).
    excelente: 10,
    muyBuena: 5,
    buena: 0,
    aceptable: -5,
    debil: -10,
  },
  packetLoss: {
    // Pérdida de paquetes (%). El límite marca el máx. aceptado por nivel.
    excelentePct: 2,
    muyBuenaPct: 5,
    buenaPct: 10,
    aceptablePct: 20,
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
    // Margen radio = RSSI - ruido (dB). Ruido medido en dBm (más negativo).
    excelente: 10,
    buena: 5,
    aceptable: 0,
    debil: -5,
  },
} as const;

const fmt = (value: number | null, digits = 0): string =>
  value === null || value === undefined || Number.isNaN(Number(value))
    ? "—"
    : Number(value).toFixed(digits);

// ---------- Clasificaciones individuales ----------

const rssiLevel = (rssi: number): string => {
  if (rssi >= LORA_BAREMO.rssi.excelente) return "EXCELENTE";
  if (rssi >= LORA_BAREMO.rssi.muyBuena) return "MUY BUENA";
  if (rssi >= LORA_BAREMO.rssi.buena) return "BUENA";
  if (rssi >= LORA_BAREMO.rssi.aceptable) return "ACEPTABLE";
  if (rssi >= LORA_BAREMO.rssi.debil) return "DÉBIL";
  return "CRÍTICA";
};

const snrLevel = (snr: number): string => {
  if (snr >= LORA_BAREMO.snr.excelente) return "EXCELENTE";
  if (snr >= LORA_BAREMO.snr.muyBuena) return "MUY BUENA";
  if (snr >= LORA_BAREMO.snr.buena) return "BUENA";
  if (snr >= LORA_BAREMO.snr.aceptable) return "ACEPTABLE";
  if (snr >= LORA_BAREMO.snr.debil) return "DÉBIL";
  return "CRÍTICA";
};

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

const RSSI_OK = ["EXCELENTE", "MUY BUENA", "BUENA"];
const RSSI_WARN = ["ACEPTABLE"];
const SNR_OK = ["EXCELENTE", "MUY BUENA", "BUENA"];
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
  noiseFloor: number | null,
  role?: string
): EvaluatedMetric {
  const origin = composeOrigin(block.sourceLabel, role);
  const rssi =
    block.rssi === null || block.rssi === undefined ? null : Number(block.rssi);
  if (
    rssi === null ||
    Number.isNaN(rssi) ||
    noiseFloor === null ||
    Number.isNaN(noiseFloor)
  ) {
    return {
      category: "MARGEN",
      metric: "MARGIN",
      value: null,
      unit: "dB",
      status: "UNKNOWN",
      label: null,
      sourceLabel: block.sourceLabel ?? null,
      elementRole: role ?? null,
      message: `${origin}Margen radio (RSSI − ruido) sin dato suficiente.`,
    };
  }
  const margin = rssi - noiseFloor;
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
    message: `${origin}Margen radio ${margin.toFixed(1)} dB (RSSI ${rssi.toFixed(0)} − ruido ${noiseFloor.toFixed(0)} dBm) → ${level}.`,
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
  noiseFloor: number | null
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

  const rssiOk =
    rssi !== null && !Number.isNaN(rssi) && rssi >= LORA_BAREMO.rssi.buena;
  const snrOk =
    snr !== null && !Number.isNaN(snr) && snr >= LORA_BAREMO.snr.buena;
  const lossOk =
    lossPct !== null &&
    !Number.isNaN(lossPct) &&
    lossPct <= LORA_BAREMO.packetLoss.buenaPct;
  const marginOk =
    rssi !== null &&
    noiseFloor !== null &&
    rssi - noiseFloor >= LORA_BAREMO.margin.aceptable;
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
      recommendation: "No se requiere actuación para este bloque.",
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

export function summarizeAnalysis(
  evaluations: EvaluatedMetric[]
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

  const recommendations: string[] = [];
  const worst = evaluations.filter((e) => e.status === "FAIL");
  const warns = evaluations.filter((e) => e.status === "WARNING");
  const coherenceFails = evaluations.filter(
    (e) => e.metric === "COHERENCIA" && e.status === "FAIL"
  );
  for (const c of coherenceFails) recommendations.push(c.message || "");
  if (worst.length > 0) {
    recommendations.push(
      `Corrige las ${worst.length} condición(es) no conforme(s) señaladas en el análisis (RSSI/SNR/pérdidas/margen/ruido).`
    );
  }
  if (warns.length > 0) {
    recommendations.push(
      `Revisa las ${warns.length} condición(es) en el límite para evitar degradación operativa.`
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

export function analyzeLora(
  blocks: LoraAnalysisBlock[],
  noiseEntries: LoraNoiseRecord[]
): { evaluations: EvaluatedMetric[]; coherence: CoherenceResult[] } {
  const evaluations: EvaluatedMetric[] = [];
  const coherence: CoherenceResult[] = [];
  const noiseFloor = highestNoiseFloor(noiseEntries);

  // Ruido por entrada de frecuencia
  for (const entry of noiseEntries) {
    evaluations.push(evaluateNoiseEntry(entry));
  }

  // Métricas por bloque (Master/Slave)
  for (const block of blocks) {
    const label = block.role ? String(block.role) : undefined;
    const origin = composeOrigin(block.sourceLabel, label);
    evaluations.push(evaluateRssi(block.rssi, label, block.sourceLabel));
    evaluations.push(evaluateSnr(block.snr, label, block.sourceLabel));
    evaluations.push(evaluatePacketLoss(block, label));
    evaluations.push(evaluateMargin(block, noiseFloor, label));

    const coherenceResult = coherenceAnalysis(block, noiseFloor);
    coherence.push(coherenceResult);
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

  return { evaluations, coherence };
}
