import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import type { ApiResponseSuccess } from "@/core/types/api-responses.types";
import type {
  CreateExteriorHeatmapPayload,
  ExteriorHeatmap,
  UpdateExteriorHeatmapPayload,
} from "../types/exterior-heatmap.types";

const VERSION = "v1";

export const getExteriorHeatmaps = async (): Promise<ExteriorHeatmap[]> => {
  try {
    const { data } = await apiClient.get<ApiResponseSuccess<ExteriorHeatmap[]>>(
      `${VERSION}/exterior-heatmaps`
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getExteriorHeatmapByAudit = async (
  auditId: string
): Promise<ExteriorHeatmap[]> => {
  try {
    const { data } = await apiClient.get<ApiResponseSuccess<ExteriorHeatmap[]>>(
      `${VERSION}/exterior-heatmaps/by-audit/${auditId}`
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const getExteriorHeatmapByLoraAudit = async (
  loraAuditId: string
): Promise<ExteriorHeatmap[]> => {
  try {
    const { data } = await apiClient.get<ApiResponseSuccess<ExteriorHeatmap[]>>(
      `${VERSION}/exterior-heatmaps/by-lora-audit/${loraAuditId}`
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const createExteriorHeatmapFromAudit = async (
  auditId: string
): Promise<ExteriorHeatmap> => {
  try {
    const { data } = await apiClient.post<ApiResponseSuccess<ExteriorHeatmap>>(
      `${VERSION}/exterior-heatmaps/from-audit/${auditId}`
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const createExteriorHeatmapFromLoraAudit = async (
  loraAuditId: string
): Promise<ExteriorHeatmap> => {
  try {
    const { data } = await apiClient.post<ApiResponseSuccess<ExteriorHeatmap>>(
      `${VERSION}/exterior-heatmaps/from-lora-audit/${loraAuditId}`
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const createExteriorHeatmap = async (
  input: CreateExteriorHeatmapPayload
): Promise<ExteriorHeatmap> => {
  try {
    const { data } = await apiClient.post<ApiResponseSuccess<ExteriorHeatmap>>(
      `${VERSION}/exterior-heatmaps`,
      input
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const updateExteriorHeatmap = async (
  id: string,
  input: UpdateExteriorHeatmapPayload
): Promise<ExteriorHeatmap> => {
  try {
    const { data } = await apiClient.patch<ApiResponseSuccess<ExteriorHeatmap>>(
      `${VERSION}/exterior-heatmaps/${id}`,
      input
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const deleteExteriorHeatmap = async (id: string): Promise<void> => {
  try {
    await apiClient.delete(`${VERSION}/exterior-heatmaps/${id}`);
  } catch (error) {
    handleApiError(error);
  }
};
