import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export class AnalysisHostCountsPresenter {
  @ApiProperty({ type: "number", example: 86 })
  ap: number;
  @ApiProperty({ type: "number", example: 118 })
  bssid: number;
  @ApiProperty({ type: "number", example: 79 })
  ssid: number;
  @ApiProperty({ type: "number", example: 91 })
  client: number;
  @ApiProperty({ type: "number", example: 63 })
  channel: number;
  @ApiProperty({ type: "number", example: 69 })
  probingClient: number;
  @ApiProperty({ type: "number", example: 83 })
  bluetoothDevice: number;

  constructor(counts: Record<string, number>) {
    this.ap = counts.ap ?? 0;
    this.bssid = counts.bssid ?? 0;
    this.ssid = counts.ssid ?? 0;
    this.client = counts.client ?? 0;
    this.channel = counts.channel ?? 0;
    this.probingClient = counts.probingClient ?? 0;
    this.bluetoothDevice = counts.bluetoothDevice ?? 0;
  }
}

export class AnalysisHostPresenter {
  @ApiProperty({ type: "number", example: 1 })
  id: number;
  @ApiProperty({ type: "string", example: "ap" })
  hostType: string;
  @ApiPropertyOptional({ type: "string", example: "localAdm:5ae403-b37aa4" })
  name?: string | null;
  @ApiPropertyOptional({ type: "string", example: "5ae403b37aa4" })
  mac?: string | null;
  @ApiPropertyOptional({ type: "string", example: "149" })
  channel?: string | null;
  @ApiPropertyOptional({ type: "string", example: "5 GHz" })
  band?: string | null;
  @ApiPropertyOptional({ type: "number", example: -83 })
  signal?: number | null;
  @ApiPropertyOptional({ type: "number", example: 7 })
  snr?: number | null;
  @ApiPropertyOptional({ type: "string", example: "MOVISTAR_7790" })
  ssid?: string | null;
  @ApiPropertyOptional({ type: "string", example: "WPA2-P" })
  securityType?: string | null;
  @ApiPropertyOptional({ type: "string", example: "802.11ac" })
  protocol?: string | null;
  @ApiProperty({ type: "boolean", example: false })
  inactive: boolean;
  @ApiPropertyOptional({ type: "string", example: "2026-07-17T07:47:50.452Z" })
  lastSeen?: Date | null;
  @ApiPropertyOptional({ type: "object", additionalProperties: true })
  counts?: Record<string, number> | null;

  constructor(host: any) {
    this.id = host.id;
    this.hostType = host.hostType;
    this.name = host.name ?? null;
    this.mac = host.mac ?? null;
    this.channel = host.channel ?? null;
    this.band = host.band ?? null;
    this.signal = host.signal ?? null;
    this.snr = host.snr ?? null;
    this.ssid = host.ssid ?? null;
    this.securityType = host.securityType ?? null;
    this.protocol = host.protocol ?? null;
    this.inactive = host.inactive ?? false;
    this.lastSeen = host.lastSeen ?? null;
    this.counts = host.counts ?? null;
  }
}

export class AnalysisPresenter {
  @ApiProperty({ type: "number", example: 1 })
  id: number;
  @ApiProperty({ type: "string", example: "6a5a0761f2214038bb7b4dd7" })
  idLinkLive: string;
  @ApiPropertyOptional({ type: "string" })
  guid?: string | null;
  @ApiPropertyOptional({ type: "string" })
  analysisGuid?: string | null;
  @ApiPropertyOptional({ type: "string", example: "wifi" })
  analysisType?: string | null;
  @ApiPropertyOptional({ type: "string", example: "20260717-104340" })
  name?: string | null;
  @ApiPropertyOptional({ type: "string", example: "ready" })
  status?: string | null;
  @ApiPropertyOptional({ type: "string", example: "2026-07-17T10:22:27.569Z" })
  startTime?: Date | null;
  @ApiPropertyOptional({ type: "string", example: "2026-07-17T10:43:43.474Z" })
  endTime?: Date | null;
  @ApiPropertyOptional({ type: "string", example: "20260717-104340" })
  fileName?: string | null;
  @ApiPropertyOptional({ type: "string" })
  unitName?: string | null;
  @ApiPropertyOptional({ type: "string", example: "AirCheckG3" })
  unitType?: string | null;
  @ApiPropertyOptional({ type: "string", example: "AIRCHECK-G3E-PRO" })
  unitHardware?: string | null;
  @ApiProperty({ type: "number", example: 86 })
  apsCount: number;
  @ApiProperty({ type: "number", example: 118 })
  bssidsCount: number;
  @ApiProperty({ type: "number", example: 79 })
  ssidsCount: number;
  @ApiProperty({ type: "number", example: 91 })
  clientsCount: number;
  @ApiProperty({ type: "number", example: 63 })
  channelsCount: number;
  @ApiProperty({ type: "number", example: 69 })
  probingClientsCount: number;
  @ApiProperty({ type: "number", example: 83 })
  bluetoothCount: number;
  @ApiPropertyOptional({ type: "number", example: 583 })
  hostCount?: number;
  @ApiPropertyOptional({ type: "string" })
  href?: string | null;
  @ApiPropertyOptional({ type: AnalysisHostCountsPresenter })
  hostCounts?: AnalysisHostCountsPresenter;

  constructor(
    analysis: any,
    options?: { hostCount?: number; hostCounts?: Record<string, number> }
  ) {
    this.id = analysis.id;
    this.idLinkLive = analysis.idLinkLive;
    this.guid = analysis.guid ?? null;
    this.analysisGuid = analysis.analysisGuid ?? null;
    this.analysisType = analysis.analysisType ?? null;
    this.name = analysis.name ?? null;
    this.status = analysis.status ?? null;
    this.startTime = analysis.startTime ?? null;
    this.endTime = analysis.endTime ?? null;
    this.fileName = analysis.fileName ?? null;
    this.unitName = analysis.unitName ?? null;
    this.unitType = analysis.unitType ?? null;
    this.unitHardware = analysis.unitHardware ?? null;
    this.apsCount = analysis.apsCount ?? 0;
    this.bssidsCount = analysis.bssidsCount ?? 0;
    this.ssidsCount = analysis.ssidsCount ?? 0;
    this.clientsCount = analysis.clientsCount ?? 0;
    this.channelsCount = analysis.channelsCount ?? 0;
    this.probingClientsCount = analysis.probingClientsCount ?? 0;
    this.bluetoothCount = analysis.bluetoothCount ?? 0;
    this.hostCount = options?.hostCount ?? analysis._count?.hosts ?? undefined;
    this.href = analysis.href ?? null;
    if (options?.hostCounts) {
      this.hostCounts = new AnalysisHostCountsPresenter(options.hostCounts);
    }
  }
}
