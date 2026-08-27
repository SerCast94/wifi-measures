import { AuditEvaluationService } from "./audit-evaluation.service";
import { DEFAULT_THRESHOLDS } from "@features/audits/domain/entities/profile-presets";
import type {
  AuditThresholds,
  EvaluationResult,
} from "@features/audits/domain/entities/audit.types";

type RawRecord = Record<string, unknown>;

const stubDatabase = { getClient: () => null };
const stubAudits = {} as never;

const makeService = () =>
  new AuditEvaluationService(
    stubDatabase as never,
    stubAudits,
    {} as never,
    {} as never
  );

const measureEntry = (
  raw: RawRecord,
  overrides: Partial<{
    measureId: string;
    idLinkLive: string | null;
    label: string | null;
    floorId: number | null;
  }> = {}
) => ({
  measureId: "measure-1",
  idLinkLive: "guid-1",
  label: "Planta 1 · Despacho",
  floorId: null,
  ...overrides,
  raw,
});

const byMetric = (
  results: EvaluationResult[],
  metric: string
): EvaluationResult => results.filter((result) => result.metric === metric)[0];

describe("AuditEvaluationService · mergeThresholds", () => {
  const service = makeService();

  it("sin perfil devuelve los umbrales por defecto", () => {
    const merged = (
      service as unknown as { mergeThresholds: (p: unknown) => AuditThresholds }
    ).mergeThresholds(null);
    expect(merged).toEqual(DEFAULT_THRESHOLDS);
  });

  it("mezcla parciales del perfil sobre los valores por defecto", () => {
    const merged = (
      service as unknown as { mergeThresholds: (p: unknown) => AuditThresholds }
    ).mergeThresholds({
      thresholds: {
        coverage: { rssi: { passMin: -65 } },
        performance: { minDownloadMbps: 100 },
      },
    });
    expect(merged.coverage.rssi.passMin).toBe(-65);
    // warnMin se conserva del defecto
    expect(merged.coverage.rssi.warnMin).toBe(
      DEFAULT_THRESHOLDS.coverage.rssi.warnMin
    );
    expect(merged.coverage.snr.passMin).toBe(
      DEFAULT_THRESHOLDS.coverage.snr.passMin
    );
    expect(merged.performance.minDownloadMbps).toBe(100);
    expect(merged.radio.channelUtilizationPct.passMax).toBe(
      DEFAULT_THRESHOLDS.radio.channelUtilizationPct.passMax
    );
  });
});

describe("AuditEvaluationService · extractFromMeasure", () => {
  const service = makeService();
  const extract = (raw: RawRecord) =>
    (
      service as unknown as {
        extractFromMeasure: (
          entry: unknown,
          thresholds: AuditThresholds
        ) => EvaluationResult[];
      }
    ).extractFromMeasure(measureEntry(raw), DEFAULT_THRESHOLDS);

  it("medida sin raw: OVERALL_RESULT desconocido, nunca inventado", () => {
    const results = extract({});
    expect(results).toHaveLength(1);
    expect(results[0].metric).toBe("OVERALL_RESULT");
    expect(results[0].status).toBe("UNKNOWN");
  });

  it("extrae RSSI/SNR conforme y ruido informativo", () => {
    const results = extract({
      linkSignalLevelMean: "-55",
      linkSNRMean: "40",
      linkNoiseLevelMean: "-95",
      overallColor: "green",
      channelUtilArray: [{ channel: 6, util: 0.3 }],
      coChannelInterference: [{ aps: 1 }],
      adjacentChannelInterference: [{ aps: 2 }],
      rogueAps: [],
      dhcpConnect: [{ color: "green" }],
      routerConnect: [{ color: "green" }],
      dns: [{ color: "green" }],
      www: [{ color: "green" }],
    });

    expect(byMetric(results, "RSSI").status).toBe("PASS");
    expect(byMetric(results, "RSSI").value).toBe(-55);
    expect(byMetric(results, "SNR").status).toBe("PASS");
    expect(byMetric(results, "NOISE").status).toBe("UNKNOWN");
    expect(byMetric(results, "CHANNEL_UTILIZATION").value).toBe(30);
    expect(byMetric(results, "CO_CHANNEL_INTERFERENCE").value).toBe(1);
    expect(byMetric(results, "ADJACENT_CHANNEL_INTERFERENCE").value).toBe(2);
    expect(byMetric(results, "ROGUE_APS").status).toBe("PASS");
    expect(byMetric(results, "ASSOCIATION").status).toBe("PASS");
    expect(byMetric(results, "DHCP").status).toBe("PASS");
    expect(byMetric(results, "INTERNET").status).toBe("PASS");
    expect(byMetric(results, "OVERALL_RESULT").message).toContain("green");
  });

  it('métricas de enlace "--": UNKNOWN honesto', () => {
    const results = extract({
      linkSignalLevelMean: "--",
      linkSNRMean: "--",
      linkNoiseLevelMean: "--",
    });

    expect(byMetric(results, "RSSI").status).toBe("UNKNOWN");
    expect(byMetric(results, "SNR").status).toBe("UNKNOWN");
    expect(byMetric(results, "ASSOCIATION").status).toBe("UNKNOWN");
    expect(byMetric(results, "DHCP").status).toBe("UNKNOWN");
    expect(byMetric(results, "INTERNET").status).toBe("UNKNOWN");
  });

  it("fallo de DHCP confirmado por ipConfigFailureReasons cuando el array está vacío", () => {
    const results = extract({
      linkSignalLevelMean: "-60",
      linkSNRMean: "35",
      ipConfigFailureReasons: ["DHCP server did not respond"],
      dhcpConnect: [],
      dns: [],
      www: [],
      routerConnect: [],
    });

    expect(byMetric(results, "DHCP").status).toBe("FAIL");
    expect(byMetric(results, "DHCP").message).toContain("DHCP");
    expect(byMetric(results, "DNS").status).toBe("UNKNOWN");
    expect(byMetric(results, "ASSOCIATION").status).toBe("PASS");
  });

  it("asociación fallida con motivos de enlace", () => {
    const results = extract({
      linkFailureReasons: ["Authentication rejected by AP"],
    });

    expect(byMetric(results, "ASSOCIATION").status).toBe("FAIL");
    expect(byMetric(results, "ASSOCIATION").message).toContain(
      "Authentication"
    );
  });

  it("conectividad real de Link-Live: tiempos en ms, colores y Success", () => {
    const results = extract({
      linkSignalLevelMean: "-61",
      linkSNRMean: "38",
      dns: [
        { dnsIp: "10.0.0.225", dnsColor: "green", dnsConnect: [7] },
        { dnsIp: "10.0.0.243", dnsColor: "green", dnsConnect: [5] },
      ],
      dns1Color: "green",
      dns2Color: "green",
      routerConnect: [2, 2, 2],
      routerColor: "green",
      dhcpConnect: [],
      ipConfigFailureReasons: ["Success"],
      ipConfigIp: "10.100.4.103",
      dhcpTotalTime: 75,
      www: [],
    });

    expect(byMetric(results, "DHCP").status).toBe("PASS");
    expect(byMetric(results, "DHCP").value).toBe(75);
    expect(byMetric(results, "DHCP").message).toContain("75 ms");
    expect(byMetric(results, "GATEWAY").status).toBe("PASS");
    expect(byMetric(results, "GATEWAY").value).toBe(2);
    expect(byMetric(results, "DNS").status).toBe("PASS");
    expect(byMetric(results, "DNS").value).toBe(7);
    expect(byMetric(results, "INTERNET").status).toBe("WARNING");
    expect(byMetric(results, "INTERNET").message).toContain("DNS");
  });

  it("timeout de asociación no inventa conectividad (DHCP/DNS/Gateway)", () => {
    const results = extract({
      linkFailureReasons: ["Timeout trying to connect to SSID (19)"],
      dhcpConnect: [],
      dns: [],
      www: [],
      routerConnect: [],
      ipConfigFailureReasons: [],
    });

    expect(byMetric(results, "ASSOCIATION").status).toBe("FAIL");
    expect(byMetric(results, "DHCP").status).toBe("UNKNOWN");
    expect(byMetric(results, "DNS").status).toBe("UNKNOWN");
    expect(byMetric(results, "GATEWAY").status).toBe("UNKNOWN");
    expect(byMetric(results, "INTERNET").status).toBe("UNKNOWN");
  });

  it("rogue APs superan el umbral estricto", () => {
    const results = extract({
      rogueAps: [{}, {}, {}],
    });
    expect(byMetric(results, "ROGUE_APS").value).toBe(3);
    expect(byMetric(results, "ROGUE_APS").status).toBe("FAIL");
  });

  it("utilización en fracción se normaliza a porcentaje", () => {
    const results = extract({
      channelUtilArray: [
        { channel: 1, utilization: 0.2 },
        { channel: 6, utilization: 0.75 },
      ],
    });
    const utilization = byMetric(results, "CHANNEL_UTILIZATION");
    expect(utilization.value).toBe(75);
    expect(utilization.status).toBe("FAIL");
    expect(utilization.message).toContain("6");
  });

  it("rendimiento y movilidad no existen en el raw: UNKNOWN declarado", () => {
    const results = extract({ linkSignalLevelMean: "-55" });
    const categories = new Set(results.map((result) => result.category));
    expect(categories.has("RENDIMIENTO")).toBe(false);
    expect(categories.has("MOVILIDAD")).toBe(false);
  });
});

describe("AuditEvaluationService · extractFromMeasure (iPerf)", () => {
  const service = makeService();
  const extract = (raw: RawRecord) =>
    (
      service as unknown as {
        extractFromMeasure: (
          entry: unknown,
          thresholds: AuditThresholds
        ) => EvaluationResult[];
      }
    ).extractFromMeasure(measureEntry(raw), DEFAULT_THRESHOLDS);

  const iperfRaw: RawRecord = {
    resultType: "iPerfTest",
    overallColor: "black",
    testState: 3,
    testInterface: "WIFI_PORT",
    protocol: 0,
    duration: 10,
    port: 5201,
    fileName: "20260827-070809.iperf",
    downstream: {
      grade: "black",
      avgThroughput: "--",
      avgPacketLoss: "--",
      avgLoss: "--",
      maxThroughput: "--",
      rateValue: 10,
    },
    upstream: {
      grade: "black",
      avgThroughput: "--",
      avgPacketLoss: "--",
      avgLoss: "--",
      maxThroughput: "--",
      rateValue: 10,
    },
    dns: [],
    www: [],
    dhcpConnect: [],
    routerConnect: [],
    channelUtilArray: [],
    rogueAps: [],
  };

  it("medida iPerf: solo RENDIMIENTO, sin filas de señal/red duplicadas", () => {
    const results = extract(iperfRaw);

    expect(results.length).toBe(3);
    expect(results.every((result) => result.category === "RENDIMIENTO")).toBe(
      true
    );
    expect(results.every((result) => result.status === "UNKNOWN")).toBe(true);
    expect(byMetric(results, "DOWNLOAD").message).toContain("iPerf");
    expect(byMetric(results, "DOWNLOAD").message).toContain("TCP");
    expect(byMetric(results, "DOWNLOAD").sourceType).toBe("MEASURE");
  });

  it("iPerf con throughput numérico: evalúa contra los umbrales del perfil", () => {
    const results = extract({
      resultType: "iPerfTest",
      protocol: 0,
      duration: 10,
      port: 5201,
      downstream: { avgThroughput: 80, avgPacketLoss: 0.3, grade: "green" },
      upstream: { avgThroughput: 40, avgPacketLoss: 0.2, grade: "green" },
    });

    expect(byMetric(results, "DOWNLOAD").value).toBe(80);
    expect(byMetric(results, "DOWNLOAD").status).toBe("PASS");
    expect(byMetric(results, "UPLOAD").value).toBe(40);
    expect(byMetric(results, "UPLOAD").status).toBe("PASS");
    expect(byMetric(results, "PACKET_LOSS").value).toBe(0.3);
    expect(byMetric(results, "PACKET_LOSS").status).toBe("PASS");
  });

  it("iPerf por debajo de umbral: FAIL de rendimiento", () => {
    const results = extract({
      resultType: "iPerfTest",
      protocol: 0,
      downstream: { avgThroughput: 10, avgPacketLoss: 5 },
      upstream: { avgThroughput: 3 },
    });

    expect(byMetric(results, "DOWNLOAD").status).toBe("FAIL");
    expect(byMetric(results, "UPLOAD").status).toBe("FAIL");
    expect(byMetric(results, "PACKET_LOSS").status).toBe("FAIL");
  });

  it("sin resultType pero con downstream/upstream: clasificada como iPerf", () => {
    const results = extract({
      downstream: { avgThroughput: 60 },
      upstream: {},
    });
    expect(byMetric(results, "DOWNLOAD")).toBeDefined();
    expect(results.every((result) => result.category === "RENDIMIENTO")).toBe(
      true
    );
  });
});

describe("AuditEvaluationService · extractFromSurvey", () => {
  const service = makeService();
  const extract = (points: Array<{ metric: string; value: number | null }>) =>
    (
      service as unknown as {
        extractFromSurvey: (
          survey: { surveyId: string; guid: string; name: string },
          points: Array<{ metric: string; value: number | null }>,
          thresholds: AuditThresholds,
          floorId: number | null
        ) => EvaluationResult[];
      }
    ).extractFromSurvey(
      { surveyId: "s1", guid: "guid-s1", name: "Planta 1" },
      points,
      DEFAULT_THRESHOLDS,
      7
    );

  it("calcula mínimo, tasa de puntos fuera de objetivo y trazabilidad de planta", () => {
    // RSSI: objetivo ≥ -67, advertencia ≥ -72. 6 puntos buenos, 2 warning, 2 fail
    const values = [-50, -55, -60, -62, -65, -66, -70, -71, -80, -90];
    const points = values.map((value) => ({ metric: "signal", value }));
    const results = extract(points);

    const minRssi = byMetric(results, "COVERAGE_MIN_RSSI");
    expect(minRssi.value).toBe(-90);
    expect(minRssi.status).toBe("FAIL");

    const rate = byMetric(results, "COVERAGE_PASS_RATE");
    expect(rate.value).toBe(40); // 4 de 10 fuera de objetivo
    expect(rate.status).toBe("FAIL");
    expect(rate.message).toContain("2 punto(s) FAIL");
    expect(rate.message).toContain("2 WARNING");
    expect(rate.sourceType).toBe("SURVEY");
    expect(rate.floorId).toBe(7);
  });

  it("cobertura conforme con todos los puntos por encima del objetivo", () => {
    const points = [-50, -52, -54].map((value) => ({
      metric: "signal",
      value,
    }));
    const results = extract(points);

    expect(byMetric(results, "COVERAGE_MIN_RSSI").status).toBe("PASS");
    expect(byMetric(results, "COVERAGE_PASS_RATE").status).toBe("PASS");
  });

  it("survey sin puntos utilizables: UNKNOWN explícito", () => {
    const results = extract([{ metric: "signal", value: null }]);
    expect(byMetric(results, "COVERAGE_PASS_RATE").status).toBe("UNKNOWN");
  });
});

describe("AuditEvaluationService · collectSeriesValues / findWorstChannel", () => {
  const service = makeService();
  const collect = (series: unknown, keys: string[]): number[] =>
    (
      service as unknown as {
        collectSeriesValues: (series: unknown, keys: string[]) => number[];
      }
    ).collectSeriesValues(series, keys);

  it("colección tolerante a elementos inválidos", () => {
    expect(
      collect(
        [null, "x", { util: 5 }, { util: "--" }, { value: 8 }],
        ["util", "value"]
      )
    ).toEqual([5, 8]);
    expect(collect("--", ["util"])).toEqual([]);
  });

  it("identifica el peor canal", () => {
    const findWorst = (series: unknown): string | null =>
      (
        service as unknown as {
          findWorstChannel: (series: unknown, keys: string[]) => string | null;
        }
      ).findWorstChannel(series, ["util"]);

    expect(
      findWorst([
        { channel: 1, util: 10 },
        { channel: 6, util: 70 },
        { channel: 11, util: 40 },
      ])
    ).toBe("6");
    expect(findWorst([])).toBeNull();
  });
});
