import { AuditThresholds } from "./audit.types";

/**
 * Umbrales base (valores recomendados para cobertura de datos en oficina
 * estándar). Sirven como perfil por defecto y como fallback si un perfil
 * no define algún valor.
 */
export const DEFAULT_THRESHOLDS: AuditThresholds = {
  coverage: {
    rssi: { passMin: -67, warnMin: -72 },
    snr: { passMin: 25, warnMin: 20 },
    minPassRatePct: { passMax: 5, warnMax: 15 },
  },
  radio: {
    channelUtilizationPct: { passMax: 50, warnMax: 70 },
    nonWifiUtilizationPct: { passMax: 10, warnMax: 25 },
    coChannelApCount: { passMax: 2, warnMax: 4 },
    adjacentChannelApCount: { passMax: 4, warnMax: 8 },
    rogueApsMax: { passMax: 0, warnMax: 2 },
  },
  performance: {
    minDownloadMbps: 50,
    minUploadMbps: 20,
    maxLatencyMs: 50,
    maxPacketLossPct: 1,
  },
};

export const PROFILE_AUDIT_TYPES = [
  "GENERAL",
  "OFICINA",
  "ADMINISTRACION_PUBLICA",
  "COLEGIO",
  "HOTEL",
  "INDUSTRIA",
  "ALTA_DENSIDAD",
  "VOZ_VOIP",
  "VIDEOCONFERENCIA",
] as const;

export type ProfileAuditType = (typeof PROFILE_AUDIT_TYPES)[number];

export interface ProfilePreset {
  name: string;
  auditType: ProfileAuditType;
  description: string;
  isDefault?: boolean;
  thresholds: AuditThresholds;
}

function merge(
  base: AuditThresholds,
  patch: {
    coverage?: Partial<AuditThresholds["coverage"]>;
    radio?: Partial<AuditThresholds["radio"]>;
    performance?: Partial<AuditThresholds["performance"]>;
  }
): AuditThresholds {
  return {
    coverage: { ...base.coverage, ...patch.coverage },
    radio: { ...base.radio, ...patch.radio },
    performance: { ...base.performance, ...patch.performance },
  };
}

/** Presets sembrados; el técnico puede editarlos desde la aplicación. */
export const PROFILE_PRESETS: ProfilePreset[] = [
  {
    name: "General",
    auditType: "GENERAL",
    description:
      "Umbrales recomendados por defecto para auditorías Wi-Fi de datos.",
    isDefault: true,
    thresholds: DEFAULT_THRESHOLDS,
  },
  {
    name: "Oficina",
    auditType: "OFICINA",
    description: "Entorno de oficina con uso estándar de datos.",
    thresholds: merge(DEFAULT_THRESHOLDS, {}),
  },
  {
    name: "Administración pública",
    auditType: "ADMINISTRACION_PUBLICA",
    description: "Edificios públicos; margen reducido en cobertura mínima.",
    thresholds: merge(DEFAULT_THRESHOLDS, {
      coverage: {
        rssi: { passMin: -65, warnMin: -70 },
        snr: { passMin: 25, warnMin: 20 },
      },
    }),
  },
  {
    name: "Colegio",
    auditType: "COLEGIO",
    description: "Alta densidad de clientes puntual (aulas).",
    thresholds: merge(DEFAULT_THRESHOLDS, {
      coverage: { rssi: { passMin: -67, warnMin: -72 } },
      radio: { channelUtilizationPct: { passMax: 45, warnMax: 65 } },
    }),
  },
  {
    name: "Hotel",
    auditType: "HOTEL",
    description: "Cobertura en habitaciones y zonas comunes.",
    thresholds: merge(DEFAULT_THRESHOLDS, {
      coverage: { rssi: { passMin: -70, warnMin: -75 } },
    }),
  },
  {
    name: "Industria",
    auditType: "INDUSTRIA",
    description: "Naves industriales; tolera RSSI menor pero exige SNR.",
    thresholds: merge(DEFAULT_THRESHOLDS, {
      coverage: {
        rssi: { passMin: -72, warnMin: -78 },
        snr: { passMin: 20, warnMin: 16 },
      },
    }),
  },
  {
    name: "Alta densidad",
    auditType: "ALTA_DENSIDAD",
    description:
      "Estadios, auditorios, eventos: prioriza utilización de canal.",
    thresholds: merge(DEFAULT_THRESHOLDS, {
      radio: {
        channelUtilizationPct: { passMax: 40, warnMax: 60 },
        coChannelApCount: { passMax: 1, warnMax: 3 },
      },
      performance: { minDownloadMbps: 30, minUploadMbps: 15 },
    }),
  },
  {
    name: "Voz / VoIP",
    auditType: "VOZ_VOIP",
    description: "Telefonía Wi-Fi: RSSI y latencia estrictos.",
    thresholds: merge(DEFAULT_THRESHOLDS, {
      coverage: {
        rssi: { passMin: -67, warnMin: -70 },
        snr: { passMin: 25, warnMin: 22 },
      },
      performance: { maxLatencyMs: 30, maxPacketLossPct: 0.5 },
    }),
  },
  {
    name: "Videoconferencia",
    auditType: "VIDEOCONFERENCIA",
    description: "Salas de vídeo: ancho de banda y latencia garantizados.",
    thresholds: merge(DEFAULT_THRESHOLDS, {
      performance: {
        minDownloadMbps: 100,
        minUploadMbps: 50,
        maxLatencyMs: 40,
        maxPacketLossPct: 0.5,
      },
    }),
  },
];
