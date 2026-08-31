import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import type {
  LoraAnalysis,
  LoraAnalysisData,
  LoraAudit,
  LoraMeasure,
  LoraNoise,
} from "../types/lora.types";

const VERSION = "v1";

export interface LoraMeasureBlockInput {
  role?: string | null;
  totalPackets?: number | null;
  successfulPackets?: number | null;
  rssi?: number | null;
  snr?: number | null;
  packetLossPct?: number | null;
  longitude?: number | null;
  latitude?: number | null;
  location?: string | null;
}

export interface CreateLoraMeasureInput {
  location?: string | null;
  time?: string | null;
  spreadingFactor?: string | null;
  txPower?: string | null;
  blocks?: LoraMeasureBlockInput[];
}

export interface LoraNoiseEntryInput {
  frequency?: number | null;
  currentScan?: number | null;
  weightedAverageScan?: number | null;
}

export interface CreateLoraNoiseInput {
  location?: string | null;
  longitude?: number | null;
  latitude?: number | null;
  entries?: LoraNoiseEntryInput[];
}

export interface CreateLoraAuditInput {
  name: string;
  code?: string | null;
  client?: string | null;
  project?: string | null;
  location?: string | null;
  technician?: string | null;
  description?: string | null;
  objective?: string | null;
  auditDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  measureId?: number | null;
  noiseId?: number | null;
}

export const getLoraMeasures = async (): Promise<LoraMeasure[]> => {
  try {
    const { data } = await apiClient.get<{ data: LoraMeasure[] }>(
      `${VERSION}/lora/measures`
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const createLoraMeasures = async (
  rows: CreateLoraMeasureInput[]
): Promise<LoraMeasure[]> => {
  try {
    const { data } = await apiClient.post<{ data: LoraMeasure[] }>(
      `${VERSION}/lora/measures`,
      { rows }
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const clearLoraMeasures = async (): Promise<void> => {
  try {
    await apiClient.delete(`${VERSION}/lora/measures`);
  } catch (error) {
    handleApiError(error);
  }
};

export const deleteLoraMeasure = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`${VERSION}/lora/measures/${id}`);
  } catch (error) {
    handleApiError(error);
  }
};

export const getLoraNoise = async (): Promise<LoraNoise[]> => {
  try {
    const { data } = await apiClient.get<{ data: LoraNoise[] }>(
      `${VERSION}/lora/noise`
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const createLoraNoise = async (
  rows: CreateLoraNoiseInput[]
): Promise<LoraNoise[]> => {
  try {
    const { data } = await apiClient.post<{ data: LoraNoise[] }>(
      `${VERSION}/lora/noise`,
      { rows }
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const clearLoraNoise = async (): Promise<void> => {
  try {
    await apiClient.delete(`${VERSION}/lora/noise`);
  } catch (error) {
    handleApiError(error);
  }
};

export const deleteLoraNoise = async (id: number): Promise<void> => {
  try {
    await apiClient.delete(`${VERSION}/lora/noise/${id}`);
  } catch (error) {
    handleApiError(error);
  }
};

export const getLoraAudits = async (q?: string): Promise<LoraAudit[]> => {
  try {
    const { data } = await apiClient.get<{ data: { items: LoraAudit[] } }>(
      `${VERSION}/lora/audits`,
      { params: q ? { q } : undefined }
    );
    return data.data.items;
  } catch (error) {
    handleApiError(error);
  }
};

export const getLoraAudit = async (id: string): Promise<LoraAudit> => {
  try {
    const { data } = await apiClient.get<{ data: LoraAudit }>(
      `${VERSION}/lora/audits/${id}`
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const createLoraAudit = async (
  input: CreateLoraAuditInput
): Promise<LoraAudit> => {
  try {
    const { data } = await apiClient.post<{ data: LoraAudit }>(
      `${VERSION}/lora/audits`,
      input
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateLoraAuditStatus = async (
  id: string,
  status: string
): Promise<LoraAudit> => {
  try {
    const { data } = await apiClient.patch<{ data: LoraAudit }>(
      `${VERSION}/lora/audits/${id}/status`,
      { status }
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const deleteLoraAudit = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`${VERSION}/lora/audits/${id}`);
  } catch (error) {
    handleApiError(error);
  }
};

export const runLoraAnalysis = async (
  id: string
): Promise<LoraAnalysis> => {
  try {
    const { data } = await apiClient.post<{ data: LoraAnalysis }>(
      `${VERSION}/lora/audits/${id}/analyze`,
      {}
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getLoraAnalysis = async (id: string): Promise<LoraAnalysis | null> => {
  try {
    const { data } = await apiClient.get<{ data: LoraAnalysis | null }>(
      `${VERSION}/lora/audits/${id}/analysis`
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getLoraAnalysisData = async (
  id: string
): Promise<LoraAnalysisData> => {
  try {
    const { data } = await apiClient.get<{ data: LoraAnalysisData }>(
      `${VERSION}/lora/audits/${id}/analysis-data`
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const loraReportPdfUrl = (id: string): string =>
  `/api/v1/lora/audits/${id}/informe.pdf`;
