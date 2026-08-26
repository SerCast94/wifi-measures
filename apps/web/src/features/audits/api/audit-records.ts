import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import type {
  AuditConclusion,
  AuditIssue,
  AuditRecommendation,
  AuditTest,
  IssueSeverity,
  RecommendationCategory,
} from "../types/audit.types";

const VERSION = "v1";

type ApiEnvelope<T> = { data: T };

// ---------- Checklist ----------

export const getAuditTests = async (id: string): Promise<AuditTest[]> => {
  try {
    const { data } = await apiClient.get<ApiEnvelope<AuditTest[]>>(
      `${VERSION}/audits/${id}/tests`
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateAuditTest = async (
  auditId: string,
  testId: string,
  input: { status?: string; notes?: string }
): Promise<AuditTest> => {
  try {
    const { data } = await apiClient.patch<ApiEnvelope<AuditTest>>(
      `${VERSION}/audits/${auditId}/tests/${testId}`,
      input
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const addManualTest = async (
  auditId: string,
  input: { title: string; section: string }
): Promise<AuditTest> => {
  try {
    const { data } = await apiClient.post<ApiEnvelope<AuditTest>>(
      `${VERSION}/audits/${auditId}/tests`,
      input
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const deleteAuditTest = async (
  auditId: string,
  testId: string
): Promise<void> => {
  try {
    await apiClient.delete(`${VERSION}/audits/${auditId}/tests/${testId}`);
  } catch (error) {
    handleApiError(error);
  }
};

// ---------- Incidencias ----------

export const getIssues = async (auditId: string): Promise<AuditIssue[]> => {
  try {
    const { data } = await apiClient.get<ApiEnvelope<AuditIssue[]>>(
      `${VERSION}/audits/${auditId}/issues`
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export interface CreateIssueInput {
  title: string;
  description?: string;
  severity?: IssueSeverity;
  locationLabel?: string;
  recommendationText?: string;
  photo?: string | null;
}

export const createIssue = async (
  auditId: string,
  input: CreateIssueInput
): Promise<AuditIssue> => {
  try {
    const { data } = await apiClient.post<ApiEnvelope<AuditIssue>>(
      `${VERSION}/audits/${auditId}/issues`,
      input
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export interface UpdateIssueInput {
  state?: string;
  severity?: IssueSeverity;
  title?: string;
  description?: string;
  recommendationText?: string;
  photo?: string | null;
}

export const updateIssue = async (
  auditId: string,
  issueId: string,
  input: UpdateIssueInput
): Promise<AuditIssue> => {
  try {
    const { data } = await apiClient.patch<ApiEnvelope<AuditIssue>>(
      `${VERSION}/audits/${auditId}/issues/${issueId}`,
      input
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const deleteIssue = async (
  auditId: string,
  issueId: string
): Promise<void> => {
  try {
    await apiClient.delete(`${VERSION}/audits/${auditId}/issues/${issueId}`);
  } catch (error) {
    handleApiError(error);
  }
};

// ---------- Recomendaciones ----------

export const getRecommendations = async (
  auditId: string
): Promise<AuditRecommendation[]> => {
  try {
    const { data } = await apiClient.get<ApiEnvelope<AuditRecommendation[]>>(
      `${VERSION}/audits/${auditId}/recommendations`
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const createRecommendation = async (
  auditId: string,
  input: { text: string; category?: string }
): Promise<AuditRecommendation> => {
  try {
    const { data } = await apiClient.post<ApiEnvelope<AuditRecommendation>>(
      `${VERSION}/audits/${auditId}/recommendations`,
      input
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateRecommendation = async (
  auditId: string,
  recommendationId: string,
  input: { text?: string; category?: RecommendationCategory; accepted?: boolean }
): Promise<AuditRecommendation> => {
  try {
    const { data } = await apiClient.patch<ApiEnvelope<AuditRecommendation>>(
      `${VERSION}/audits/${auditId}/recommendations/${recommendationId}`,
      input
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

// ---------- Conclusiones ----------

export const getConclusion = async (auditId: string): Promise<AuditConclusion | null> => {
  try {
    const { data } = await apiClient.get<ApiEnvelope<AuditConclusion | null>>(
      `${VERSION}/audits/${auditId}/conclusion`
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateConclusion = async (
  auditId: string,
  input: { finalText?: string; globalResult?: string }
): Promise<AuditConclusion> => {
  try {
    const { data } = await apiClient.put<ApiEnvelope<AuditConclusion>>(
      `${VERSION}/audits/${auditId}/conclusion`,
      input
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};
