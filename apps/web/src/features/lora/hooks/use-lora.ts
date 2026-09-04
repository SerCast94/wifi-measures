import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import type { AppError } from "@/core/models/app-error";
import {
  clearLoraMeasures,
  clearLoraNoise,
  createLoraAudit,
  createLoraMeasures,
  createLoraNoise,
  deleteLoraAudit,
  deleteLoraMeasure,
  deleteLoraNoise,
  getLoraAnalysis,
  getLoraAnalysisData,
  getLoraAudit,
  getLoraAudits,
  getLoraMeasures,
  getLoraNoise,
  runLoraAnalysis,
  updateLoraAuditStatus,
  updateLoraAudit,
  type CreateLoraAuditInput,
  type CreateLoraMeasureInput,
  type CreateLoraNoiseInput,
} from "../api/lora-api";
import type {
  LoraAnalysis,
  LoraAnalysisData,
  LoraAudit,
  LoraMeasure,
  LoraNoise,
} from "../types/lora.types";

const loraKeys = (suffix: string) => [QUERY_KEYS.lora, suffix];

export const useLoraMeasures = () =>
  useQuery<LoraMeasure[], AppError>({
    queryKey: loraKeys("measures"),
    queryFn: getLoraMeasures,
  });

export const useCreateLoraMeasures = () => {
  const queryClient = useQueryClient();
  return useMutation<LoraMeasure[], AppError, CreateLoraMeasureInput[]>({
    mutationFn: createLoraMeasures,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loraKeys("measures") });
    },
  });
};

export const useDeleteLoraMeasure = () => {
  const queryClient = useQueryClient();
  return useMutation<void, AppError, number>({
    mutationFn: deleteLoraMeasure,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loraKeys("measures") });
    },
  });
};

export const useClearLoraMeasures = () => {
  const queryClient = useQueryClient();
  return useMutation<void, AppError, void>({
    mutationFn: clearLoraMeasures,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loraKeys("measures") });
    },
  });
};

export const useLoraNoise = () =>
  useQuery<LoraNoise[], AppError>({
    queryKey: loraKeys("noise"),
    queryFn: getLoraNoise,
  });

export const useCreateLoraNoise = () => {
  const queryClient = useQueryClient();
  return useMutation<LoraNoise[], AppError, CreateLoraNoiseInput[]>({
    mutationFn: createLoraNoise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loraKeys("noise") });
    },
  });
};

export const useDeleteLoraNoise = () => {
  const queryClient = useQueryClient();
  return useMutation<void, AppError, number>({
    mutationFn: deleteLoraNoise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loraKeys("noise") });
    },
  });
};

export const useClearLoraNoise = () => {
  const queryClient = useQueryClient();
  return useMutation<void, AppError, void>({
    mutationFn: clearLoraNoise,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loraKeys("noise") });
    },
  });
};

export const useLoraAudits = (q?: string) =>
  useQuery<LoraAudit[], AppError>({
    queryKey: loraKeys(`audits:${q ?? ""}`),
    queryFn: () => getLoraAudits(q),
  });

export const useLoraAudit = (id: string) =>
  useQuery<LoraAudit, AppError>({
    queryKey: loraKeys(`audit:${id}`),
    queryFn: () => getLoraAudit(id),
    enabled: Boolean(id),
  });

export const useCreateLoraAudit = () => {
  const queryClient = useQueryClient();
  return useMutation<LoraAudit, AppError, CreateLoraAuditInput>({
    mutationFn: createLoraAudit,
    onSuccess: (audit) => {
      queryClient.setQueryData(loraKeys(`audit:${audit.id}`), audit);
      queryClient.invalidateQueries({ queryKey: loraKeys("audits") });
    },
  });
};

export const useUpdateLoraAuditStatus = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<LoraAudit, AppError, string>({
    mutationFn: (status) => updateLoraAuditStatus(id, status),
    onSuccess: (audit) => {
      queryClient.setQueryData(loraKeys(`audit:${id}`), audit);
      queryClient.invalidateQueries({ queryKey: loraKeys("audits") });
    },
  });
};

export const useLinkLoraAuditFloorPlan = () => {
  const queryClient = useQueryClient();
  return useMutation<
    LoraAudit,
    AppError,
    { auditId: string; floorPlanId: number | null }
  >({
    mutationFn: ({ auditId, floorPlanId }) =>
      updateLoraAudit(auditId, { floorPlanId }),
    onSuccess: (audit) => {
      queryClient.setQueryData(loraKeys(`audit:${audit.id}`), audit);
      queryClient.invalidateQueries({ queryKey: loraKeys("audits") });
    },
  });
};

export const useDeleteLoraAudit = () => {
  const queryClient = useQueryClient();
  return useMutation<void, AppError, string>({
    mutationFn: deleteLoraAudit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: loraKeys("audits") });
    },
  });
};

export const useLoraAnalysis = (id: string) =>
  useQuery<LoraAnalysis | null, AppError>({
    queryKey: loraKeys(`analysis:${id}`),
    queryFn: () => getLoraAnalysis(id),
    enabled: Boolean(id),
  });

export const useLoraAnalysisData = (id: string) =>
  useQuery<LoraAnalysisData, AppError>({
    queryKey: loraKeys(`analysis-data:${id}`),
    queryFn: () => getLoraAnalysisData(id),
    enabled: Boolean(id),
  });

export const useRunLoraAnalysis = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<LoraAnalysis, AppError, void>({
    mutationFn: () => runLoraAnalysis(id),
    onSuccess: (analysis) => {
      if (analysis) {
        queryClient.setQueryData(loraKeys(`analysis:${id}`), analysis);
      }
      queryClient.invalidateQueries({
        queryKey: loraKeys(`analysis:${id}`),
      });
      queryClient.invalidateQueries({
        queryKey: loraKeys(`analysis-data:${id}`),
      });
    },
  });
};
