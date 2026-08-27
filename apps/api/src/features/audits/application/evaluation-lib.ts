import { EvaluationStatus } from "@features/audits/domain/entities/audit.types";
import {
  RangeThreshold,
  MaxThreshold,
  CountThreshold,
  ThresholdSnapshot,
} from "@features/audits/domain/entities/audit.types";

interface EvalOutcome {
  value: number | null;
  status: EvaluationStatus;
  threshold?: ThresholdSnapshot;
  message: string;
  /** unidad del valor evaluado; null si no aplica */
  unit: string | null;
}

/**
 * Convierte un valor Link-Live a número. Los equipos NetAlly usan la cadena
 * "--" para indicar métrica no medida; también acepta números ya parseados.
 */
export function parseNum(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const trimmed = value.trim();
    if (trimmed === "" || trimmed === "--") return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

/** Métrica mayor-es-mejor (RSSI, SNR, throughput...). */
export function evalHigher(
  value: number | null,
  threshold: RangeThreshold | undefined,
  unit: string,
  metricLabel: string
): EvalOutcome {
  if (value === null || !threshold || threshold.passMin === undefined) {
    return {
      value,
      status: "UNKNOWN",
      message: `${metricLabel}: dato no disponible o sin umbral configurado.`,
      unit,
    };
  }
  const snap: ThresholdSnapshot = {
    metric: metricLabel,
    operator: ">=",
    value: threshold.passMin,
    unit,
    extra: { warnMin: threshold.warnMin },
  };
  if (value >= threshold.passMin) {
    return {
      value,
      status: "PASS",
      threshold: snap,
      message: `${metricLabel} ${value} ${unit}: conforme (≥ ${threshold.passMin} ${unit}).`,
      unit,
    };
  }
  if (threshold.warnMin !== undefined && value >= threshold.warnMin) {
    return {
      value,
      status: "WARNING",
      threshold: snap,
      message: `${metricLabel} ${value} ${unit}: en el límite recomendado (${threshold.warnMin} a ${threshold.passMin} ${unit}).`,
      unit,
    };
  }
  return {
    value,
    status: "FAIL",
    threshold: snap,
    message: `${metricLabel} ${value} ${unit}: por debajo del nivel recomendado (< ${
      threshold.warnMin ?? threshold.passMin
    } ${unit}).`,
    unit,
  };
}

/** Métrica menor-es-mejor (utilización, latencia, pérdida, % puntos malos). */
export function evalLower(
  value: number | null,
  threshold: MaxThreshold | undefined,
  unit: string,
  metricLabel: string
): EvalOutcome {
  if (value === null || !threshold || threshold.passMax === undefined) {
    return {
      value,
      status: "UNKNOWN",
      message: `${metricLabel}: dato no disponible o sin umbral configurado.`,
      unit,
    };
  }
  const snap: ThresholdSnapshot = {
    metric: metricLabel,
    operator: "<=",
    value: threshold.passMax,
    unit,
    extra: { warnMax: threshold.warnMax },
  };
  if (value <= threshold.passMax) {
    return {
      value,
      status: "PASS",
      threshold: snap,
      message: `${metricLabel} ${value}${unit}: conforme (≤ ${threshold.passMax}${unit}).`,
      unit,
    };
  }
  if (threshold.warnMax !== undefined && value <= threshold.warnMax) {
    return {
      value,
      status: "WARNING",
      threshold: snap,
      message: `${metricLabel} ${value}${unit}: por encima del objetivo (${threshold.passMax}${unit}), dentro del margen de advertencia (hasta ${threshold.warnMax}${unit}).`,
      unit,
    };
  }
  return {
    value,
    status: "FAIL",
    threshold: snap,
    message: `${metricLabel} ${value}${unit}: supera el umbral aceptable (${
      threshold.warnMax ?? threshold.passMax
    }${unit}).`,
    unit,
  };
}

export function evalCount(
  value: number | null,
  threshold: CountThreshold | undefined,
  metricLabel: string
): EvalOutcome {
  const unit = null;
  if (value === null || !threshold || threshold.passMax === undefined) {
    return {
      value,
      status: "UNKNOWN",
      message: `${metricLabel}: dato no disponible o sin umbral configurado.`,
      unit,
    };
  }
  const snap: ThresholdSnapshot = {
    metric: metricLabel,
    operator: "<=",
    value: threshold.passMax,
    extra: { warnMax: threshold.warnMax },
  };
  if (value <= threshold.passMax) {
    return {
      value,
      status: "PASS",
      threshold: snap,
      message: `${metricLabel}: ${value} (máximo recomendado ${threshold.passMax}).`,
      unit,
    };
  }
  if (threshold.warnMax !== undefined && value <= threshold.warnMax) {
    return {
      value,
      status: "WARNING",
      threshold: snap,
      message: `${metricLabel}: ${value}, por encima del máximo recomendado (${threshold.passMax}).`,
      unit,
    };
  }
  return {
    value,
    status: "FAIL",
    threshold: snap,
    message: `${metricLabel}: ${value}, claramente por encima de lo tolerable (${
      threshold.warnMax ?? threshold.passMax
    }).`,
    unit,
  };
}

export function unknownResult(
  message: string,
  value: number | null = null
): EvalOutcome {
  return { value, status: "UNKNOWN", unit: null, message };
}

const POSITIVE_HINTS = ["ok", "success", "pass", "green", "true", "correct"];
const NEGATIVE_HINTS = [
  "fail",
  "error",
  "timeout",
  "unreachable",
  "red",
  "false",
];

/**
 * Interpreta un array de resultados de conectividad del raw (dhcpConnect, dns,
 * www, routerConnect...). El formato exacto de los elementos no está
 * documentado en los datos locales, por lo que se analizan claves habituales y
 * si no hay señal clara se devuelve UNKNOWN en lugar de inventar resultado.
 */
export function interpretConnectivityArray(arr: unknown): {
  ran: boolean;
  status: EvaluationStatus;
  detail: string;
} {
  if (!Array.isArray(arr) || arr.length === 0) {
    return { ran: false, status: "UNKNOWN", detail: "Prueba no realizada" };
  }
  let positives = 0;
  let negatives = 0;
  for (const item of arr) {
    if (item === null || typeof item !== "object") continue;
    const record = item as Record<string, unknown>;
    for (const [key, rawValue] of Object.entries(record)) {
      const valueStr = String(rawValue ?? "").toLowerCase();
      if (!valueStr) continue;
      if (POSITIVE_HINTS.some((hint) => valueStr.includes(hint)))
        positives += 1;
      else if (NEGATIVE_HINTS.some((hint) => valueStr.includes(hint)))
        negatives += 1;
      if (/^(color|status|state|result)$/i.test(key)) break;
    }
  }
  if (positives > 0 && negatives === 0) {
    return {
      ran: true,
      status: "PASS",
      detail: `${arr.length} comprobación(es) correctas`,
    };
  }
  if (negatives > 0 && positives === 0) {
    return {
      ran: true,
      status: "FAIL",
      detail: `${arr.length} comprobación(es) con fallo`,
    };
  }
  return {
    ran: true,
    status: "UNKNOWN",
    detail: `Prueba realizada (${arr.length} registro(s)) pero el resultado no es interpretable`,
  };
}

/**
 * Interpreta la señal de conectividad de una prueba del raw tolerando los
 * formatos reales de Link-Live que el análisis genérico no captura:
 *  - arrays numéricos (tiempos de respuesta en ms del gateway/DNS), donde el
 *    mero hecho de recibir respuesta implica prueba realizada y correcta;
 *  - campos de color a nivel superior (dnsColor, routerColor, ipConfigColor,
 *    webColor...) que confirman el resultado cuando el array viene vacío;
 *  - ipConfigFailureReasons=["Success"] / presencia de ipConfigIp para
 *    confirmar que la configuración IP (y con ella DHCP) terminó con éxito.
 */
export function interpretConnectivitySignal(
  key: string,
  raw: Record<string, unknown>
): {
  ran: boolean;
  status: EvaluationStatus;
  detail: string;
  latencyMs: number | null;
} {
  const direct = raw[key];

  if (
    Array.isArray(direct) &&
    direct.length > 0 &&
    direct.every((item) => typeof item === "number")
  ) {
    const nums = direct as number[];
    const ms = Math.round(Math.max(...nums));
    return {
      ran: true,
      status: "PASS",
      detail: `${nums.length} respuesta(s) en ${ms} ms`,
      latencyMs: ms,
    };
  }

  const generic = interpretConnectivityArray(direct);

  const colorKeys: Record<string, string[]> = {
    dns: ["dnsColor", "dns1Color", "dns2Color"],
    routerConnect: ["routerColor"],
    dhcpConnect: ["ipConfigColor", "dhcpColor"],
    www: ["webColor", "wwwColor", "httpColor"],
  };
  let colorStatus: EvaluationStatus | null = null;
  for (const field of colorKeys[key] ?? []) {
    const text = String(raw[field] ?? "").toLowerCase();
    if (POSITIVE_HINTS.some((hint) => text.includes(hint))) {
      colorStatus = "PASS";
      break;
    }
    if (NEGATIVE_HINTS.some((hint) => text.includes(hint))) {
      colorStatus = "FAIL";
      break;
    }
  }

  let reasonsStatus: EvaluationStatus | null = null;
  if (key === "dhcpConnect") {
    const reasons = raw["ipConfigFailureReasons"];
    if (Array.isArray(reasons) && reasons.length > 0) {
      const texts = reasons.map((item) => String(item ?? "").toLowerCase());
      const anyPositive = texts.some((text) =>
        POSITIVE_HINTS.some((hint) => text.includes(hint))
      );
      const anyNegative = texts.some((text) =>
        NEGATIVE_HINTS.some((hint) => text.includes(hint))
      );
      if (anyPositive && !anyNegative) reasonsStatus = "PASS";
    }
  }

  let configStatus: EvaluationStatus | null = null;
  if (
    key === "dhcpConnect" &&
    typeof raw["ipConfigIp"] === "string" &&
    raw["ipConfigIp"].trim().length > 0
  ) {
    configStatus = "PASS";
  }

  const status =
    generic.status === "PASS" || generic.status === "FAIL"
      ? generic.status
      : (colorStatus ?? reasonsStatus ?? configStatus ?? "UNKNOWN");
  const ran = generic.ran || status !== "UNKNOWN";

  const latencyMs = (() => {
    const numbers: number[] = [];
    const walk = (value: unknown): void => {
      if (typeof value === "number") numbers.push(value);
      else if (Array.isArray(value)) value.forEach(walk);
      else if (value && typeof value === "object")
        Object.values(value).forEach(walk);
    };
    if (key === "dhcpConnect") {
      walk(raw["dhcpConnect"]);
      walk(raw["dhcpTotalTime"]);
    } else if (key === "dns") {
      walk(raw["dns"]);
      walk(raw["dnsConnect"]);
      walk(raw["dns1Connect"]);
      walk(raw["dns2Connect"]);
    } else {
      walk(raw[key]);
    }
    return numbers.length ? Math.round(Math.max(...numbers)) : null;
  })();

  let detail: string;
  if (status === "PASS") {
    detail = generic.status === "PASS" ? generic.detail : "Prueba correcta";
    if (latencyMs !== null) detail = `${detail} (${latencyMs} ms)`;
  } else if (status === "FAIL") {
    detail =
      generic.status === "FAIL" ? generic.detail : "Fallo en la comprobación";
  } else {
    detail = "Prueba no realizada";
  }

  return {
    ran,
    status,
    detail,
    latencyMs: status === "PASS" ? latencyMs : null,
  };
}

/**
 * Señales secundarias: los motivos de fallo del equipo (ipConfigFailureReasons,
 * linkFailureReasons...) permiten confirmar fallos cuando el array principal
 * viene vacío.
 */
export function reasonsHintFailure(
  reasons: unknown,
  keywords: string[]
): string | null {
  if (!Array.isArray(reasons)) return null;
  for (const reason of reasons) {
    const text = String(reason ?? "");
    const lower = text.toLowerCase();
    if (keywords.some((keyword) => lower.includes(keyword))) return text;
  }
  return null;
}

/** Normaliza valores de utilización que pueden llegar en fracción (0-1) o %. */
export function normalizePercent(values: number[]): number | null {
  if (values.length === 0) return null;
  const max = Math.max(...values);
  const normalized = max > 1 ? max : max * 100;
  return Math.round(normalized * 10) / 10;
}
