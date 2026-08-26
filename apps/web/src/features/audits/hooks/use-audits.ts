import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import type { AppError } from "@/core/models/app-error";
import {
  createAudit,
  deleteAudit,
  getAudit,
  getAuditProfiles,
  getAudits,
  getAuditsComparison,
  getAuditStats,
  updateAudit,
  updateAuditStatus,
  type CreateAuditInput,
  type UpdateAuditInput,
} from "../api/audit-crud";
import type {
  Audit,
  AuditComparisonRow,
  AuditProfile,
  AuditStats,
} from "../types/audit.types";

export const useAuditsStats = () =>
  useQuery<AuditStats, AppError>({
    queryKey: [QUERY_KEYS.audits, "stats"],
    queryFn: getAuditStats,
  });

export const useAuditsComparison = () =>
  useQuery<AuditComparisonRow[], AppError>({
    queryKey: [QUERY_KEYS.audits, "comparativa"],
    queryFn: getAuditsComparison,
  });

export const useAudits = (q?: string) =>
  useQuery<Audit[], AppError>({
    queryKey: [QUERY_KEYS.audits, q ?? ""],
    queryFn: () => getAudits(q),
  });

export const useAudit = (id: string) =>
  useQuery<Audit, AppError>({
    queryKey: [QUERY_KEYS.audits, id],
    queryFn: () => getAudit(id),
    enabled: Boolean(id),
  });

export const useAuditProfiles = () =>
  useQuery<AuditProfile[], AppError>({
    queryKey: [QUERY_KEYS.auditProfiles],
    queryFn: getAuditProfiles,
    staleTime: 5 * 60 * 1000,
  });

export const useCreateAudit = () => {
  const queryClient = useQueryClient();
  return useMutation<Audit, AppError, CreateAuditInput>({
    mutationFn: createAudit,
    onSuccess: (audit) => {
      queryClient.setQueryData([QUERY_KEYS.audits, audit.id], audit);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.audits] });
    },
  });
};

export const useUpdateAudit = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<Audit, AppError, UpdateAuditInput>({
    mutationFn: (input) => updateAudit(id, input),
    onSuccess: (audit) => {
      queryClient.setQueryData([QUERY_KEYS.audits, id], audit);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.audits] });
    },
  });
};

export const useUpdateAuditStatus = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<Audit, AppError, string>({
    mutationFn: (status) => updateAuditStatus(id, status),
    onSuccess: (audit) => {
      queryClient.setQueryData([QUERY_KEYS.audits, id], audit);
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.audits] });
    },
  });
};

export const useDeleteAudit = () => {
  const queryClient = useQueryClient();
  return useMutation<void, AppError, string>({
    mutationFn: deleteAudit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.audits] });
    },
  });
};
