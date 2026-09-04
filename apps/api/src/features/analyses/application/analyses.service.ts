import { Injectable, Logger } from "@nestjs/common";

import { AppConfigService } from "@config/app-config.service";
import { DatabaseService } from "@core/database/database.service";
import { LinkLiveService } from "@core/linklive/linklive.service";
import {
  ANALYSIS_HOST_TYPES,
  getAnalysisHostTypeDefinition,
} from "@features/analyses/domain/analysis-host-types";

const DETAIL_REQUIRED = new Set(
  ANALYSIS_HOST_TYPES.filter((type) => type.detailRequired).map(
    (type) => type.key
  )
);

@Injectable()
export class AnalysesService {
  private readonly logger = new Logger(AnalysesService.name);

  constructor(
    private readonly database: DatabaseService,
    private readonly linkLiveService: LinkLiveService,
    private readonly config: AppConfigService
  ) {}

  private get client() {
    return this.database.getClient();
  }

  async getAll() {
    const client = this.client;
    if (!client) return [];

    return client.linkLiveAnalysis.findMany({
      orderBy: { startTime: "desc" },
      include: {
        _count: { select: { hosts: true } },
      },
    });
  }

  async getById(id: string) {
    const client = this.client;
    if (!client) return null;

    const analysisId = Number(id);
    if (!Number.isFinite(analysisId)) return null;

    const analysis = await client.linkLiveAnalysis.findUnique({
      where: { id: analysisId },
    });
    if (!analysis) return null;

    const counts = await client.linkLiveAnalysisHost.groupBy({
      by: ["hostType"],
      where: { analysisId },
      _count: { _all: true },
    });

    const hostCounts: Record<string, number> = {};
    for (const row of counts) {
      hostCounts[row.hostType] = row._count._all;
    }

    return { analysis, hostCounts };
  }

  async getHosts(analysisId: string, type?: string) {
    const client = this.client;
    if (!client) return [];

    const numericAnalysisId = Number(analysisId);
    if (!Number.isFinite(numericAnalysisId)) return [];

    const where: Record<string, any> = { analysisId: numericAnalysisId };
    if (type) {
      const definition = getAnalysisHostTypeDefinition(type);
      where.hostType = definition.key;
    }

    return client.linkLiveAnalysisHost.findMany({
      where,
      orderBy: [{ inactive: "asc" }, { signal: "desc" }],
    });
  }

  async delete(id: string) {
    const client = this.client;
    if (!client) return false;

    const analysisId = Number(id);
    if (!Number.isFinite(analysisId)) return false;

    try {
      await client.linkLiveAnalysis.delete({ where: { id: analysisId } });
      return true;
    } catch {
      return false;
    }
  }

  async sync() {
    const organizationId = this.config.get("linkLiveOrgId");
    const analyses = await this.linkLiveService.listAnalyses({
      query: { organizationId, analysisType: "wifi" },
    });

    const synced: any[] = [];
    for (const analysis of analyses) {
      try {
        const saved = await this.syncOne(analysis);
        if (saved) synced.push(saved);
      } catch (error: any) {
        this.logger.warn(
          `No se pudo sincronizar el análisis ${analysis?._id}: ${
            error?.message ?? error
          }`
        );
      }
    }

    return synced;
  }

  private async syncOne(analysis: any) {
    const id = analysis?._id;
    if (!id) return null;

    let detail: any = analysis;
    try {
      detail = await this.linkLiveService.getAnalysis(id);
    } catch {
      // se usa el análisis de la lista si falla el detalle
    }

    const hosts: any[] = [];
    for (const type of ANALYSIS_HOST_TYPES) {
      try {
        const list = await this.linkLiveService.listWifiHosts(type.key, id);
        const rawList: any = list;
        const items: any[] = Array.isArray(rawList)
          ? rawList
          : (rawList.list ?? rawList.items ?? []);

        if (DETAIL_REQUIRED.has(type.key)) {
          const enriched = await this.mapWithPool(items, 12, async (host) => {
            const hostId = host?._id;
            if (!hostId) return null;
            try {
              const detailHost = await this.linkLiveService.getWifiHost(
                hostId,
                id
              );
              return this.flattenHost(type.key, detailHost, host);
            } catch {
              return this.flattenHost(type.key, host, host);
            }
          });
          hosts.push(...enriched.filter(Boolean));
        } else {
          hosts.push(
            ...items
              .map((host) => this.flattenHost(type.key, host, host))
              .filter(Boolean)
          );
        }
      } catch (error: any) {
        this.logger.warn(
          `No se pudieron obtener hosts ${type.key} de ${id}: ${
            error?.message ?? error
          }`
        );
      }
    }

    const client = this.client;
    if (!client) {
      throw new Error("Base de datos no disponible");
    }

    const payload = {
      idLinkLive: id,
      guid: this.stringOrNull(detail.guid),
      analysisGuid: this.stringOrNull(detail.analysisGuid),
      analysisType: this.stringOrNull(detail.analysisType),
      name: this.stringOrNull(detail.fileName ?? detail.name),
      status: this.stringOrNull(detail.status),
      startTime: this.dateOrNull(detail.startTime ?? detail.created_at),
      endTime: this.dateOrNull(detail.unitCompletedAt),
      fileName: this.stringOrNull(detail.fileName),
      unitId: this.stringOrNull(detail.unitId),
      unitName: this.stringOrNull(detail.unitName),
      unitType: this.stringOrNull(detail.unitType),
      unitHardware: this.stringOrNull(detail.unitHardware),
      apsCount: detail.apsCount ?? 0,
      bssidsCount: detail.bssidsCount ?? 0,
      ssidsCount: detail.ssidsCount ?? 0,
      clientsCount: detail.clientsCount ?? 0,
      channelsCount: detail.channelsCount ?? 0,
      probingClientsCount:
        hosts.filter((host) => host.hostType === "probingClient").length ?? 0,
      bluetoothCount:
        hosts.filter((host) => host.hostType === "bluetoothDevice").length ?? 0,
      href: this.stringOrNull(detail.href),
      raw: detail ?? null,
    };

    const existing = await client.linkLiveAnalysis.findUnique({
      where: { idLinkLive: id },
    });

    let saved: any;
    if (existing) {
      saved = await client.linkLiveAnalysis.update({
        where: { id: existing.id },
        data: payload,
      });
      await client.linkLiveAnalysisHost.deleteMany({
        where: { analysisId: existing.id },
      });
    } else {
      saved = await client.linkLiveAnalysis.create({ data: payload });
    }

    if (hosts.length > 0) {
      await client.linkLiveAnalysisHost.createMany({
        data: hosts.map((host: any) => ({
          ...host,
          analysisId: saved.id,
        })),
      });
    }

    return saved;
  }

  private flattenHost(type: string, record: any, fallback: any): any {
    if (!record) return null;

    const wh = record.wifiHost ?? {};
    const wifiItem = record.wifiItem ?? fallback?.wifiItem ?? {};
    const wifiClientData = record.wifiClient?.wifiClientData ?? {};
    const hostId = record._id ?? fallback?._id;
    if (!hostId) return null;

    const base = {
      hostType: type,
      hostKey: hostId,
      wifiItem: wifiItem ?? null,
      raw: record ?? null,
    };

    switch (type) {
      case "ap":
      case "bssid":
        return {
          ...base,
          name: this.stringOrNull(wh.bestNameFormatted),
          mac: this.stringOrNull(wh.macAddress ?? wh.formattedMac),
          channel: this.stringOrNull(wh.channel),
          band: this.bandLabel(wifiItem.bands?.[0]),
          signal: this.numberOrNull(wh.signal),
          snr: this.numberOrNull(wh.snr),
          securityType: this.stringOrNull(
            wh.securityType ?? wifiItem.securityTypeSet?.[0]
          ),
          protocol: this.stringOrNull(wh.highest80211Type),
          inactive: Boolean(
            wh.inactive ?? record.inactive ?? wifiItem.inactive
          ),
          lastSeen: this.msDate(
            wh.lastSeen ?? record.lastSeen ?? wifiItem.lastSeen
          ),
          counts: this.pickCounts(record),
        };
      case "ssid":
        return {
          ...base,
          name: this.stringOrNull(record.ssid),
          mac: null,
          channel: this.stringOrNull(record.channel ?? wifiItem.channels?.[0]),
          band: this.bandLabel(wifiItem.bands?.[0]),
          signal: this.numberOrNull(record.signal),
          snr: this.numberOrNull(record.snr),
          securityType: this.stringOrNull(
            wifiItem.securityTypeSet?.[0] ?? record.securityType
          ),
          protocol: this.protocolLabel(wifiItem.wlanProtocolSet),
          inactive: Boolean(record.inactive ?? wifiItem.inactive),
          lastSeen: this.msDate(record.lastSeen ?? wifiItem.lastSeen),
          counts: this.pickCounts(record),
        };
      case "client":
      case "probingClient":
        return {
          ...base,
          name: this.stringOrNull(wh.bestNameFormatted ?? record.name),
          mac: this.stringOrNull(wh.macAddress ?? record.macAddress),
          channel: this.stringOrNull(
            record.channel ?? wh.channel ?? wifiClientData.channel
          ),
          band: this.bandLabel(
            wifiItem.bands?.[0] ??
              wifiItem.airwiseActiveBands?.[0] ??
              wifiClientData.band
          ),
          signal: this.numberOrNull(
            record.signal ?? wh.signal ?? wifiClientData.signal
          ),
          snr: this.numberOrNull(record.snr ?? wh.snr),
          ssid: this.stringOrNull(record.ssid ?? wifiClientData.ssid),
          securityType: this.stringOrNull(
            wh.securityType ?? wifiItem.securityTypeSet?.[0]
          ),
          protocol: this.stringOrNull(wh.highest80211Type),
          inactive: Boolean(
            wh.inactive ?? record.inactive ?? wifiItem.inactive
          ),
          lastSeen: this.msDate(
            wh.lastSeen ?? record.lastSeen ?? wifiItem.lastSeen
          ),
          counts: this.pickCounts(record),
        };
      case "channel":
        return {
          ...base,
          name: null,
          mac: null,
          channel: this.stringOrNull(
            record.channel ?? wifiItem.id ?? wifiItem.airwiseActiveChannels?.[0]
          ),
          band: this.bandLabel(
            record.wifiBand ?? record.band ?? wifiItem.bands?.[0]
          ),
          signal: this.numberOrNull(record.strongestApSignal),
          snr: this.numberOrNull(record.snr),
          securityType: null,
          protocol: null,
          inactive: Boolean(record.active === false || wifiItem.inactive),
          lastSeen: this.msDate(record.lastSeen ?? wifiItem.lastSeen),
          counts: this.pickCounts(record),
        };
      case "bluetoothDevice":
        return {
          ...base,
          name: this.stringOrNull(
            record.name && record.name !== "--" ? record.name : null
          ),
          mac: this.stringOrNull(record.address),
          channel: null,
          band: null,
          signal: this.numberOrNull(record.rssi ?? record.signal),
          snr: null,
          ssid: null,
          securityType: null,
          protocol: this.stringOrNull(record.beaconType),
          inactive: false,
          lastSeen: this.msDate(record.lastSeen),
          counts: null,
        };
      default:
        return {
          ...base,
          name: this.stringOrNull(record.name ?? wh.bestNameFormatted),
          mac: this.stringOrNull(record.mac ?? wh.macAddress),
          signal: this.numberOrNull(record.signal ?? wh.signal),
          snr: this.numberOrNull(record.snr ?? wh.snr),
          inactive: Boolean(record.inactive ?? wifiItem.inactive),
          lastSeen: this.msDate(record.lastSeen ?? wifiItem.lastSeen),
          counts: this.pickCounts(record),
        };
    }
  }

  private bandLabel(band: unknown): string | null {
    if (typeof band === "string" && band.length > 0) return band;
    const labels: Record<number, string> = {
      1: "2.4 GHz",
      2: "5 GHz",
      3: "6 GHz",
    };
    return labels[Number(band)] ?? null;
  }

  private protocolLabel(protocols: unknown): string | null {
    if (!Array.isArray(protocols) || protocols.length === 0) return null;
    return protocols.join(", ");
  }

  private pickCounts(record: any): Record<string, number> | null {
    const keys = [
      "apCount",
      "ssidCount",
      "bssidCount",
      "clientCount",
      "channelCount",
      "probingClientCount",
    ];
    const counts: Record<string, number> = {};
    let found = false;
    for (const key of keys) {
      const value = Number(record?.[key]);
      if (Number.isFinite(value)) {
        counts[key] = value;
        found = true;
      }
    }
    return found ? counts : null;
  }

  private async mapWithPool<T, R>(
    items: T[],
    limit: number,
    fn: (item: T, index: number) => Promise<R>
  ): Promise<R[]> {
    if (items.length === 0) return [];
    const results: R[] = new Array(items.length);
    let index = 0;
    const worker = async () => {
      while (index < items.length) {
        const current = index++;
        try {
          results[current] = await fn(items[current], current);
        } catch {
          // se deja el hueco; se filtra después
        }
      }
    };
    const workers = Array.from({ length: Math.min(limit, items.length) }, () =>
      worker()
    );
    await Promise.all(workers);
    return results;
  }

  private numberOrNull(value: unknown): number | null {
    if (value === null || value === undefined || value === "") return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  }

  private stringOrNull(value: unknown): string | null {
    if (typeof value === "string" && value.length > 0) return value;
    if (typeof value === "number" && Number.isFinite(value))
      return String(value);
    return null;
  }

  private msDate(value: unknown): Date | null {
    if (typeof value === "number" && Number.isFinite(value)) {
      return new Date(value);
    }
    if (typeof value !== "string" && !(value instanceof Date)) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  private dateOrNull(value: unknown): Date | null {
    if (typeof value !== "string" && !(value instanceof Date)) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }
}
