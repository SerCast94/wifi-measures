/**
 * Clasificación del tipo de medida Link-Live.
 *
 * - "iperf": prueba de rendimiento (AirCheck G3 con cliente/servidor iPerf).
 * - "wireless": prueba de señal / conectividad / red (AirCheck G3).
 *
 * El campo `resultType` del raw (y la columna homónima, poblada desde
 * `emisiones`) distingue ambos; como refuerzo se detectan los objetos
 * `downstream`/`upstream` presentes solo en las medidas iPerf.
 */
export type MeasureKind = "iperf" | "wireless";

const IPERF_RESULT_TYPES = new Set(["iperftest", "iperf", "ip-perf"]);

export function classifyMeasureType(
  resultType: string | null | undefined
): MeasureKind {
  const normalized = String(resultType ?? "")
    .trim()
    .toLowerCase();
  return IPERF_RESULT_TYPES.has(normalized) ? "iperf" : "wireless";
}

export function measureKind(raw: unknown): MeasureKind {
  if (raw === null || raw === undefined || typeof raw !== "object")
    return "wireless";
  const record = raw as Record<string, unknown>;
  if (
    classifyMeasureType(
      typeof record["resultType"] === "string" ? record["resultType"] : null
    ) === "iperf"
  ) {
    return "iperf";
  }
  if ("downstream" in record || "upstream" in record) return "iperf";
  return "wireless";
}
