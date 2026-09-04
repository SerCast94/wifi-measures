import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import { AppError } from "@/core/models/app-error";
import {
  createExteriorHeatmapFromAudit,
  createExteriorHeatmapFromLoraAudit,
  deleteExteriorHeatmap,
  getExteriorHeatmaps,
} from "../api/exterior-heatmap-api";
import type { ExteriorHeatmap } from "../types/exterior-heatmap.types";

export const useExteriorHeatmaps = () => {
  return useQuery<ExteriorHeatmap[]>({
    queryKey: [QUERY_KEYS.exteriorHeatmaps],
    queryFn: getExteriorHeatmaps,
  });
};

export const useCreateExteriorHeatmapFromAudit = () => {
  const queryClient = useQueryClient();

  return useMutation<ExteriorHeatmap, AppError, string>({
    mutationFn: (auditId: string) =>
      createExteriorHeatmapFromAudit(auditId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.exteriorHeatmaps],
      });
    },
  });
};

export const useCreateExteriorHeatmapFromLoraAudit = () => {
  const queryClient = useQueryClient();

  return useMutation<ExteriorHeatmap, AppError, string>({
    mutationFn: (loraAuditId: string) =>
      createExteriorHeatmapFromLoraAudit(loraAuditId),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.exteriorHeatmaps],
      });
    },
  });
};

export const useDeleteExteriorHeatmap = () => {
  const queryClient = useQueryClient();

  return useMutation<unknown, AppError, string>({
    mutationFn: (id: string) => deleteExteriorHeatmap(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.exteriorHeatmaps],
      });
    },
  });
};