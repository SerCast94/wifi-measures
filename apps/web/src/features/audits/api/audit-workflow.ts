import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import type {
  AuditDashboard,
  AuditEvaluation,
  AuditMembers,
  DataQualityResult,
  SyncAuditResult,
} from "../types/audit.types";

const VERSION = "v1";

type ApiEnvelope<T> = { data: T };

export const getAuditDashboard = async (id: string): Promise<AuditDashboard> => {
  try {
    const { data } = await apiClient.get<ApiEnvelope<AuditDashboard>>(
      `${VERSION}/audits/${id}/dashboard`
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getAuditMembers = async (id: string): Promise<AuditMembers> => {
  try {
    const { data } = await apiClient.get<ApiEnvelope<AuditMembers>>(
      `${VERSION}/audits/${id}/members`
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getAuditCandidates = async (
  id: string,
  type: "measure" | "survey" | "analysis",
  page = 1,
  size = 50
): Promise<unknown[]> => {
  try {
    const { data } = await apiClient.get<ApiEnvelope<unknown[]>>(
      `${VERSION}/audits/${id}/candidates`,
      { params: { type, page, size } }
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const addAuditMembers = async (
  id: string,
  type: "measure" | "survey" | "analysis",
  ids: Array<string | number>
): Promise<void> => {
  try {
    await apiClient.post(`${VERSION}/audits/${id}/members`, { type, ids });
  } catch (error) {
    handleApiError(error);
  }
};

export const removeAuditMember = async (
  id: string,
  type: "measure" | "survey" | "analysis",
  memberId: string
): Promise<void> => {
  try {
    await apiClient.delete(`${VERSION}/audits/${id}/members/${type}/${memberId}`);
  } catch (error) {
    handleApiError(error);
  }
};

export const updateAuditMember = async (
  id: string,
  type: "measure" | "survey" | "analysis",
  memberId: string,
  input: { floorId?: number | null; label?: string }
): Promise<void> => {
  try {
    await apiClient.patch(
      `${VERSION}/audits/${id}/members/${type}/${memberId}`,
      input
    );
  } catch (error) {
    handleApiError(error);
  }
};

export const setAuditFloors = async (id: string, names: string[]): Promise<void> => {
  try {
    await apiClient.put(`${VERSION}/audits/${id}/floors`, { names });
  } catch (error) {
    handleApiError(error);
  }
};

export const runEvaluation = async (
  id: string
): Promise<{
  batchId: string;
  total: number;
  byStatus: Record<string, number>;
  suggestedIssues: number;
  skippedIssues: number;
  recommendations: number;
  globalResult: string;
}> => {
  try {
    const { data } = await apiClient.post<ApiEnvelope<Record<string, unknown>>>(
      `${VERSION}/audits/${id}/evaluate`,
      {}
    );
    return data.data as {
      batchId: string;
      total: number;
      byStatus: Record<string, number>;
      suggestedIssues: number;
      skippedIssues: number;
      recommendations: number;
      globalResult: string;
    };
  } catch (error) {
    handleApiError(error);
  }
};

export const getEvaluations = async (id: string): Promise<AuditEvaluation[]> => {
  try {
    const { data } = await apiClient.get<ApiEnvelope<AuditEvaluation[]>>(
      `${VERSION}/audits/${id}/evaluations`
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const syncAudit = async (id: string): Promise<SyncAuditResult> => {
  try {
    const { data } = await apiClient.post<ApiEnvelope<SyncAuditResult>>(
      `${VERSION}/audits/${id}/sync`,
      {}
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getDataQuality = async (id: string): Promise<DataQualityResult> => {
  try {
    const { data } = await apiClient.get<ApiEnvelope<DataQualityResult>>(
      `${VERSION}/audits/${id}/data-quality`
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

// ---------- Informe ----------

export const getReportData = async (
  id: string
): Promise<Record<string, unknown>> => {
  try {
    const { data } = await apiClient.get<ApiEnvelope<Record<string, unknown>>>(
      `${VERSION}/audits/${id}/report-data`
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const saveReportVersion = async (
  id: string,
  sections: string[]
): Promise<{ version: number }> => {
  try {
    const { data } = await apiClient.post<
      ApiEnvelope<Record<string, unknown>>
    >(`${VERSION}/audits/${id}/reports`, { sections });
    return data.data as unknown as { version: number };
  } catch (error) {
    handleApiError(error);
  }
};
