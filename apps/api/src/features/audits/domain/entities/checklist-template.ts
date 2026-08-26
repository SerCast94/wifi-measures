import { AuditTestSection } from "./audit.types";

export interface ChecklistTemplateItem {
  key: string;
  title: string;
  required: boolean;
  /** tipo de dato Link-Live que satisface el ítem (para autocompletar) */
  sourceType?: "MEASURE" | "SURVEY" | "ANALYSIS" | "MANUAL";
}

export interface ChecklistTemplateSection {
  section: AuditTestSection;
  items: ChecklistTemplateItem[];
}

/**
 * Plantilla de checklist de auditoría. Versionada en código; al crear una
 * auditoría se instancian sus filas en `audit_tests` para que el técnico
 * pueda marcarlas completadas.
 */
export const CHECKLIST_TEMPLATE: ChecklistTemplateSection[] = [
  {
    section: "PRE_AUDITORIA",
    items: [
      { key: "pre.client", title: "Cliente identificado", required: true, sourceType: "MANUAL" },
      { key: "pre.location", title: "Ubicación identificada", required: true, sourceType: "MANUAL" },
      { key: "pre.floorplans", title: "Planos disponibles", required: true, sourceType: "SURVEY" },
      { key: "pre.floors", title: "Plantas configuradas", required: false, sourceType: "MANUAL" },
      { key: "pre.target_ssids", title: "SSID objetivo identificado", required: true, sourceType: "MANUAL" },
      { key: "pre.credentials", title: "Credenciales disponibles", required: false, sourceType: "MANUAL" },
      { key: "pre.equipment", title: "Equipo NetAlly identificado", required: true, sourceType: "MEASURE" },
      { key: "pre.technician", title: "Técnico identificado", required: true, sourceType: "MANUAL" },
      { key: "pre.objective", title: "Objetivo de auditoría definido", required: true, sourceType: "MANUAL" },
      { key: "pre.iperf_server", title: "Servidor iPerf configurado si procede", required: false, sourceType: "MANUAL" },
    ],
  },
  {
    section: "RECONOCIMIENTO_RF",
    items: [
      { key: "rf.wifi_analysis", title: "Wi-Fi Analysis realizado", required: true, sourceType: "ANALYSIS" },
      { key: "rf.aps_identified", title: "APs identificados", required: true, sourceType: "ANALYSIS" },
      { key: "rf.ssids_identified", title: "SSIDs identificados", required: true, sourceType: "ANALYSIS" },
      { key: "rf.channels_analyzed", title: "Canales analizados", required: true, sourceType: "ANALYSIS" },
      { key: "rf.channel_utilization", title: "Utilización de canales analizada", required: true, sourceType: "MEASURE" },
      { key: "rf.interference", title: "Interferencias analizadas", required: true, sourceType: "MEASURE" },
      { key: "rf.co_channel", title: "Interferencia co-canal analizada", required: true, sourceType: "MEASURE" },
      { key: "rf.adjacent_channel", title: "Interferencia adyacente analizada", required: true, sourceType: "MEASURE" },
      { key: "rf.rogue_aps", title: "Rogue APs revisados", required: true, sourceType: "MEASURE" },
    ],
  },
  {
    section: "COBERTURA",
    items: [
      { key: "cov.plan_loaded", title: "Plano cargado", required: true, sourceType: "SURVEY" },
      { key: "cov.plan_calibrated", title: "Plano calibrado", required: false, sourceType: "SURVEY" },
      { key: "cov.airmapper", title: "AirMapper realizado", required: true, sourceType: "SURVEY" },
      { key: "cov.coverage_24ghz", title: "Cobertura 2,4 GHz analizada", required: false, sourceType: "SURVEY" },
      { key: "cov.coverage_5ghz", title: "Cobertura 5 GHz analizada", required: false, sourceType: "SURVEY" },
      { key: "cov.coverage_6ghz", title: "Cobertura 6 GHz analizada si procede", required: false, sourceType: "SURVEY" },
      { key: "cov.rssi", title: "RSSI analizado", required: true, sourceType: "MEASURE" },
      { key: "cov.snr", title: "SNR analizado", required: true, sourceType: "MEASURE" },
      { key: "cov.noise", title: "Ruido analizado", required: false, sourceType: "MEASURE" },
    ],
  },
  {
    section: "CONECTIVIDAD",
    items: [
      { key: "conn.dhcp", title: "DHCP", required: true, sourceType: "MEASURE" },
      { key: "conn.gateway", title: "Gateway", required: true, sourceType: "MEASURE" },
      { key: "conn.dns", title: "DNS", required: true, sourceType: "MEASURE" },
      { key: "conn.ping_lan", title: "Ping LAN", required: false, sourceType: "MEASURE" },
      { key: "conn.internet", title: "Internet", required: true, sourceType: "MEASURE" },
      { key: "conn.http_https", title: "HTTP/HTTPS si procede", required: false, sourceType: "MEASURE" },
    ],
  },
  {
    section: "RENDIMIENTO",
    items: [
      { key: "perf.iperf_download", title: "iPerf download", required: false, sourceType: "MANUAL" },
      { key: "perf.iperf_upload", title: "iPerf upload", required: false, sourceType: "MANUAL" },
      { key: "perf.latency", title: "Latencia", required: false, sourceType: "MANUAL" },
      { key: "perf.packet_loss", title: "Pérdida de paquetes", required: false, sourceType: "MANUAL" },
      { key: "perf.critical_points", title: "Puntos críticos comprobados", required: false, sourceType: "MANUAL" },
    ],
  },
  {
    section: "MOVILIDAD",
    items: [
      { key: "mob.roaming_test", title: "Roaming realizado", required: false, sourceType: "MANUAL" },
      { key: "mob.ap_transition", title: "Cambio entre AP comprobado", required: false, sourceType: "MANUAL" },
      { key: "mob.sticky_client", title: "Sticky client comprobado", required: false, sourceType: "MANUAL" },
      { key: "mob.connectivity_loss", title: "Pérdida de conectividad durante roaming comprobada", required: false, sourceType: "MANUAL" },
    ],
  },
  {
    section: "CIERRE",
    items: [
      { key: "close.data_synced", title: "Todos los datos sincronizados", required: true, sourceType: "MANUAL" },
      { key: "close.data_reviewed", title: "Datos revisados", required: true, sourceType: "MANUAL" },
      { key: "close.issues_documented", title: "Incidencias documentadas", required: true, sourceType: "MANUAL" },
      { key: "close.conclusions_reviewed", title: "Conclusiones revisadas", required: true, sourceType: "MANUAL" },
      { key: "close.recommendations_added", title: "Recomendaciones introducidas", required: true, sourceType: "MANUAL" },
      { key: "close.report_generated", title: "Informe generado", required: true, sourceType: "MANUAL" },
      { key: "close.report_validated", title: "Informe validado", required: false, sourceType: "MANUAL" },
    ],
  },
];

export const CHECKLIST_TEMPLATE_VERSION = 1;
