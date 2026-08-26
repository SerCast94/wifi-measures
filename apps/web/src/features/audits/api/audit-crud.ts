import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import type {
  Audit,
  AuditComparisonRow,
  AuditProfile,
  AuditStats,
} from "../types/audit.types";

const VERSION = "v1";

export interface CreateAuditInput {
  name: string;
  code?: string;
  client?: string;
  project?: string;
  location?: string;
  address?: string;
  building?: string;
  technician?: string;
  description?: string;
  objective?: string;
  scope?: string;
  methodology?: string;
  observations?: string;
  auditDate?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  profileId?: string | null;
  areaKeys?: string[];
  ssidFilter?: string | null;
  floorNames?: string[];
}

type ApiEnvelope<T> = { data: T };

export const getAudits = async (q?: string): Promise<Audit[]> => {
  try {
    const { data } = await apiClient.get<{
      data: { items: Audit[]; total: number };
    }>(`${VERSION}/audits`, {
      params: q ? { q } : undefined,
    });
    return data.data.items;
  } catch (error) {
    handleApiError(error);
  }
};

export const getAudit = async (id: string): Promise<Audit> => {
  try {
    const { data } = await apiClient.get<ApiEnvelope<Audit>>(`${VERSION}/audits/${id}`);
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getAuditProfiles = async (): Promise<AuditProfile[]> => {
  try {
    const { data } = await apiClient.get<ApiEnvelope<AuditProfile[]>>(
      `${VERSION}/audits/profiles`
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getAuditStats = async (): Promise<AuditStats> => {
  try {
    const { data } = await apiClient.get<ApiEnvelope<AuditStats>>(
      `${VERSION}/audits/stats`
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getAuditsComparison = async (): Promise<AuditComparisonRow[]> => {
  try {
    const { data } = await apiClient.get<{ data: { audits: AuditComparisonRow[] } }>(
      `${VERSION}/audits/comparativa`
    );
    return data.data.audits;
  } catch (error) {
    handleApiError(error);
  }
};

export const createAudit = async (input: CreateAuditInput): Promise<Audit> => {
  try {
    const { data } = await apiClient.post<ApiEnvelope<Audit>>(`${VERSION}/audits`, input);
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export type UpdateAuditInput = Partial<CreateAuditInput>;

export const updateAudit = async (
  id: string,
  input: UpdateAuditInput
): Promise<Audit> => {
  try {
    const { data } = await apiClient.put<ApiEnvelope<Audit>>(
      `${VERSION}/audits/${id}`,
      input
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateAuditStatus = async (
  id: string,
  status: string
): Promise<Audit> => {
  try {
    const { data } = await apiClient.patch<ApiEnvelope<Audit>>(
      `${VERSION}/audits/${id}/status`,
      { status }
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const deleteAudit = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`${VERSION}/audits/${id}`);
  } catch (error) {
    handleApiError(error);
  }
};
