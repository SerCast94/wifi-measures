import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import type { AppError } from "@/core/models/app-error";
import {
  createIssue,
  createRecommendation,
  deleteIssue,
  getConclusion,
  getIssues,
  getRecommendations,
  updateConclusion,
  updateIssue,
  updateRecommendation,
  type CreateIssueInput,
  type UpdateIssueInput,
} from "../api/audit-records";
import type {
  AuditConclusion,
  AuditIssue,
  AuditRecommendation,
} from "../types/audit.types";

const invalidate = (queryClient: ReturnType<typeof useQueryClient>, id: string) => {
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.audits, id] });
};

export const useIssues = (id: string) =>
  useQuery<AuditIssue[], AppError>({
    queryKey: [QUERY_KEYS.audits, id, "issues"],
    queryFn: () => getIssues(id),
    enabled: Boolean(id),
  });

export const useCreateIssue = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<AuditIssue, AppError, CreateIssueInput>({
    mutationFn: (input) => createIssue(id, input),
    onSuccess: () => invalidate(queryClient, id),
  });
};

export const useUpdateIssue = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<
    AuditIssue,
    AppError,
    { issueId: string; input: UpdateIssueInput }
  >({
    mutationFn: ({ issueId, input }) => updateIssue(id, issueId, input),
    onSuccess: () => invalidate(queryClient, id),
  });
};

export const useDeleteIssue = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<void, AppError, string>({
    mutationFn: (issueId) => deleteIssue(id, issueId),
    onSuccess: () => invalidate(queryClient, id),
  });
};

export const useRecommendations = (id: string) =>
  useQuery<AuditRecommendation[], AppError>({
    queryKey: [QUERY_KEYS.audits, id, "recommendations"],
    queryFn: () => getRecommendations(id),
    enabled: Boolean(id),
  });

export const useCreateRecommendation = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<
    AuditRecommendation,
    AppError,
    { text: string; category?: string }
  >({
    mutationFn: (input) => createRecommendation(id, input),
    onSuccess: () => invalidate(queryClient, id),
  });
};

export const useUpdateRecommendation = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<
    AuditRecommendation,
    AppError,
    { recommendationId: string; input: Record<string, unknown> }
  >({
    mutationFn: ({ recommendationId, input }) =>
      updateRecommendation(
        id,
        recommendationId,
        input as { text?: string; category?: never; accepted?: boolean }
      ),
    onSuccess: () => invalidate(queryClient, id),
  });
};

export const useConclusion = (id: string) =>
  useQuery<AuditConclusion | null, AppError>({
    queryKey: [QUERY_KEYS.audits, id, "conclusion"],
    queryFn: () => getConclusion(id),
    enabled: Boolean(id),
  });

export const useUpdateConclusion = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<
    AuditConclusion,
    AppError,
    { finalText?: string; globalResult?: string }
  >({
    mutationFn: (input) => updateConclusion(id, input),
    onSuccess: () => invalidate(queryClient, id),
  });
};
