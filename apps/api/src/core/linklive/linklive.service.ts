import { Global, Injectable, UnauthorizedException } from "@nestjs/common";

import axios, { AxiosInstance } from "axios";

import { AppConfigService } from "@config/app-config.service";

export interface LinkLiveResult {
  _id: string;
  created_at?: string;
  uploaded_at?: string;
  updated_at?: string;
  resultType?: string;
  unit_id?: string;
  unit_name?: string;
  unit_mac?: string;
  unit_serial?: string;
  unit_firmwareVersion?: string;
  unit_type?: string;
  profileName?: string;
  overallColor?: string;
  linkColor?: string;
  labels?: string[];
  failureReasons?: string[];
  linkFailureReasons?: string[];
  meta?: Record<string, any>;
  attachments?: any[];
  [key: string]: any;
}

export interface LinkLiveUnit {
  _id: string;
  name?: string;
  unitType?: string;
  model?: string;
  hardwareVersion?: string;
  mac?: string;
  serialNumber?: string;
  ipAddress?: string | null;
  ipWifiManagement?: string | null;
  ipWiredManagement?: string | null;
  lastSeen?: string;
  firmwareVersion?: string | null;
  otas?: Record<string, string>;
  claimedBy?: string;
  lastBattery?: number | null;
  lastLinkSpeed?: number | null;
  created_at?: string;
  updated_at?: string;
  labels?: string[];
  [key: string]: any;
}

export interface LinkLiveHeatmap {
  _id: string;
  guid?: string;
  organizationId?: string;
  analysisGuid?: string;
  fileName?: string;
  surveyName?: string;
  surveyNames?: string[];
  surveyDescription?: string;
  surveyMode?: string;
  surveyPointCount?: number;
  surveyBluetooth?: boolean;
  surveyActive1x1?: boolean;
  surveyStartTime?: string;
  startTimeLocal?: string;
  ssid?: string;
  ssid1x1?: string;
  floorPlanFilename?: string;
  floorPlanWidthPx?: number;
  floorPlanHeightPx?: number;
  floorPlanScalePpf?: number;
  floorPlanScaledWidthPx?: number;
  floorPlanScaledHeightPx?: number;
  floorPlanScaledScalePpf?: number;
  fileType?: string;
  status?: string;
  unitId?: string;
  unitName?: string;
  unitMac?: string;
  unitSerial?: string;
  unitType?: string;
  unitHardware?: string;
  href?: string;
  created_at?: string;
  updated_at?: string;
  uploaded_at?: string;
  [key: string]: any;
}

export interface LinkLiveFloorPlan {
  _id: string;
  heatmapId?: string;
  fileName?: string;
  href?: string;
  widthPx?: number;
  heightPx?: number;
  floorPlanScalePpf?: number;
  [key: string]: any;
}

export interface LinkLiveHeatmapPoint {
  x?: number;
  y?: number;
  pointIdx?: number;
  hostType?: string;
  value?: number | null;
  time?: string;
  [key: string]: any;
}

export interface LinkLiveAnalysisItem {
  _id: string;
  guid?: string;
  analysisGuid?: string;
  analysisType?: string;
  fileName?: string;
  status?: string;
  startTime?: string;
  unitCompletedAt?: string;
  unitId?: string;
  unitName?: string;
  unitType?: string;
  unitHardware?: string;
  apsCount?: number;
  bssidsCount?: number;
  ssidsCount?: number;
  clientsCount?: number;
  channelsCount?: number;
  bluetoothCount?: number;
  href?: string;
  created_at?: string;
  updated_at?: string;
  [key: string]: any;
}

export interface LinkLiveWifiHost {
  _id: string;
  wifiHostType?: string;
  wifiItem?: Record<string, any>;
  wifiHost?: Record<string, any>;
  wifiClient?: Record<string, any>;
  [key: string]: any;
}

export interface LinkLiveUploadedFile {
  _id: string;
  fileName?: string;
  title?: string;
  fileFormat?: string;
  fileSize?: number;
  status?: string;
  href?: string;
  mediumImage?: string;
  thumb?: string;
  unitId?: string;
  unitName?: string;
  unitMac?: string;
  unitSerial?: string;
  unitType?: string;
  resultIds?: string[];
  uploaded_at?: string;
  created_at?: string;
  [key: string]: any;
}

@Global()
@Injectable()
export class LinkLiveService {
  private readonly http: AxiosInstance;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;

  constructor(private readonly config: AppConfigService) {
    this.http = axios.create({ timeout: 30000 });
  }

  async login(): Promise<void> {
    const username = this.config.get("linkLiveUsername");
    const password = this.config.get("linkLivePassword");
    const appId = this.config.get("linkLiveAppId");
    const orgId = this.config.get("linkLiveOrgId");

    if (!username || !password) {
      throw new Error(
        "Link-Live credentials are not configured (LINKLIVE_USERNAME/LINKLIVE_PASSWORD)"
      );
    }

    const credentials = Buffer.from(`${username}:${password}`).toString(
      "base64"
    );

    const claims: Record<string, string> = {};
    if (appId) claims.app = appId;
    if (orgId) claims.org = orgId;

    try {
      const { data } = await this.http.post(
        `${this.config.get("linkLiveAuthUrl")}/v2/auth/login`,
        { claims },
        { headers: { Authorization: `Basic ${credentials}` } }
      );

      this.accessToken = data.accessToken ?? null;
      this.refreshToken = data.refreshToken ?? null;

      if (!this.accessToken) {
        throw new Error(
          "Link-Live login response did not include an access token"
        );
      }
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new UnauthorizedException("Credenciales de Link-Live inválidas");
      }
      throw new Error(`No se pudo autenticar con Link-Live: ${error.message}`);
    }
  }

  async getAccessToken(): Promise<string> {
    if (this.accessToken) {
      return this.accessToken;
    }
    await this.login();
    return this.accessToken as string;
  }

  async listResults(params?: {
    offset?: number;
    limit?: number;
    query?: Record<string, any>;
  }): Promise<LinkLiveResult[]> {
    return this.request<LinkLiveResult[]>({
      url: `${this.config.get("linkLiveBaseUrl")}/v1/admin/results`,
      params: {
        offset: params?.offset ?? 0,
        limit: params?.limit ?? 100,
        ...(params?.query ? { query: JSON.stringify(params.query) } : {}),
      },
    });
  }

  async listUnits(): Promise<LinkLiveUnit[]> {
    return this.request<LinkLiveUnit[]>({
      url: `${this.config.get("linkLiveBaseUrl")}/v1/admin/units`,
    });
  }

  async listUploadedFiles(params?: {
    unitId?: string;
    resultId?: string;
    fileFormat?: string;
  }): Promise<LinkLiveUploadedFile[]> {
    return this.request<LinkLiveUploadedFile[]>({
      url: `${this.config.get("linkLiveBaseUrl")}/v1/admin/uploadedfiles`,
      params: {
        ...(params?.unitId ? { unitId: params.unitId } : {}),
        ...(params?.resultId ? { resultId: params.resultId } : {}),
        ...(params?.fileFormat ? { fileFormat: params.fileFormat } : {}),
      },
    });
  }

  async listHeatmaps(params?: {
    offset?: number;
    limit?: number;
    query?: Record<string, any>;
  }): Promise<LinkLiveHeatmap[]> {
    return this.request<LinkLiveHeatmap[]>({
      url: `${this.config.get("linkLiveBaseUrl")}/v1/admin/heatmap`,
      params: {
        offset: params?.offset ?? 0,
        limit: params?.limit ?? 200,
        ...(params?.query ? { query: JSON.stringify(params.query) } : {}),
      },
    });
  }

  async getHeatmap(heatmapId: string): Promise<LinkLiveHeatmap> {
    return this.request<LinkLiveHeatmap>({
      url: `${this.config.get("linkLiveBaseUrl")}/v1/admin/heatmap/${heatmapId}`,
    });
  }

  async listHeatmapFloorplans(heatmapId: string): Promise<LinkLiveFloorPlan[]> {
    return this.request<LinkLiveFloorPlan[]>({
      url: `${this.config.get("linkLiveBaseUrl")}/v1/admin/heatmapFloorplans`,
      params: {
        query: JSON.stringify({ heatmapId }),
      },
    });
  }

  async getHeatmapDisplayData(
    heatmapId: string,
    valueKey: string,
    hostType: string
  ): Promise<LinkLiveHeatmapPoint[]> {
    const organizationId = this.config.get("linkLiveOrgId");
    return this.request<LinkLiveHeatmapPoint[]>({
      url: `${this.config.get(
        "linkLiveBaseUrl"
      )}/v1/admin/heatmapHosts/heatmapDisplayData/${valueKey}`,
      params: {
        query: JSON.stringify({
          heatmapId,
          organizationId,
          hostType,
          filters: {},
          nthAp: 0,
        }),
      },
    });
  }

  async getHeatmapBaseXYList(
    heatmapId: string
  ): Promise<LinkLiveHeatmapPoint[]> {
    const organizationId = this.config.get("linkLiveOrgId");
    return this.request<LinkLiveHeatmapPoint[]>({
      url: `${this.config.get(
        "linkLiveBaseUrl"
      )}/v1/admin/heatmapHosts/baseXYList`,
      params: {
        query: JSON.stringify({ heatmapId, organizationId }),
      },
    });
  }

  async listAnalyses(params?: {
    offset?: number;
    limit?: number;
    query?: Record<string, any>;
  }): Promise<LinkLiveAnalysisItem[]> {
    return this.request<LinkLiveAnalysisItem[]>({
      url: `${this.config.get("linkLiveBaseUrl")}/v1/admin/analysis`,
      params: {
        offset: params?.offset ?? 0,
        limit: params?.limit ?? 200,
        ...(params?.query ? { query: JSON.stringify(params.query) } : {}),
      },
    });
  }

  async getAnalysis(analysisId: string): Promise<LinkLiveAnalysisItem> {
    return this.request<LinkLiveAnalysisItem>({
      url: `${this.config.get(
        "linkLiveBaseUrl"
      )}/v1/admin/analysis/${analysisId}`,
    });
  }

  async listWifiHosts(
    wifiHostType: string,
    analysisId: string
  ): Promise<LinkLiveWifiHost[]> {
    const organizationId = this.config.get("linkLiveOrgId");
    return this.request<LinkLiveWifiHost[]>({
      url: `${this.config.get("linkLiveBaseUrl")}/v1/admin/wifiHosts`,
      params: {
        query: JSON.stringify({
          analysisId,
          wifiHostType,
          organizationId,
        }),
      },
    });
  }

  async getWifiHost(
    hostId: string,
    analysisId: string
  ): Promise<LinkLiveWifiHost> {
    const organizationId = this.config.get("linkLiveOrgId");
    return this.request<LinkLiveWifiHost>({
      url: `${this.config.get("linkLiveBaseUrl")}/v1/admin/wifiHosts/${hostId}`,
      params: {
        query: JSON.stringify({ analysisId, organizationId }),
      },
    });
  }

  async downloadImage(url: string): Promise<string> {
    const { data } = await this.http.get<Buffer>(url, {
      responseType: "arraybuffer",
    });
    return Buffer.from(data).toString("base64");
  }

  private async request<T>(options: {
    url: string;
    params?: Record<string, any>;
  }): Promise<T> {
    try {
      const token = await this.getAccessToken();
      return await this.doRequest<T>(token, options);
    } catch (error: any) {
      const status = error?.response?.status;
      if (status === 401 || status === 426) {
        this.accessToken = null;
        const token = await this.getAccessToken();
        return this.doRequest<T>(token, options);
      }
      throw error;
    }
  }

  private async doRequest<T>(
    token: string,
    options: { url: string; params?: Record<string, any> }
  ): Promise<T> {
    try {
      const { data } = await this.http.get<T>(options.url, {
        params: options.params,
        headers: { Authorization: `Access ${token}` },
      });
      return data;
    } catch (error: any) {
      if (error?.response?.status === 401 || error?.response?.status === 426) {
        throw error;
      }
      throw new Error(
        `No se pudieron obtener datos de Link-Live: ${
          error?.response?.data?.message ?? error.message
        }`
      );
    }
  }
}
