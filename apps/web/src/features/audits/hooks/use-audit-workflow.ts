import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import type { AppError } from "@/core/models/app-error";
import {
  addAuditMembers,
  getAuditCandidates,
  getAuditDashboard,
  getAuditMembers,
  getDataQuality,
  getEvaluations,
  getReportData,
  removeAuditMember,
  runEvaluation,
  saveReportVersion,
  setAuditFloors,
  syncAudit,
  updateAuditMember,
} from "../api/audit-workflow";
import {
  getAuditTests,
  updateAuditTest,
  addManualTest,
  deleteAuditTest,
} from "../api/audit-records";
import type {
  AuditDashboard,
  AuditEvaluation,
  AuditMembers,
  AuditTest,
  DataQualityResult,
} from "../types/audit.types";

export const useAuditDashboard = (id: string) =>
  useQuery<AuditDashboard, AppError>({
    queryKey: [QUERY_KEYS.audits, id, "dashboard"],
    queryFn: () => getAuditDashboard(id),
    enabled: Boolean(id),
  });

export const useAuditMembers = (id: string) =>
  useQuery<AuditMembers, AppError>({
    queryKey: [QUERY_KEYS.audits, id, "members"],
    queryFn: () => getAuditMembers(id),
    enabled: Boolean(id),
  });

type MemberType = "measure" | "survey" | "analysis";

export const useAuditCandidates = (
  id: string,
  type: MemberType,
  page = 1,
  size = 50
) =>
  useQuery<unknown[], AppError>({
    queryKey: [QUERY_KEYS.audits, id, "candidates", type, page, size],
    queryFn: () => getAuditCandidates(id, type, page, size),
    enabled: Boolean(id),
  });

const invalidate = (queryClient: ReturnType<typeof useQueryClient>, id: string) => {
  queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.audits, id] });
};

export const useAddAuditMembers = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<void, AppError, { type: MemberType; ids: Array<string | number> }>({
    mutationFn: ({ type, ids }) => addAuditMembers(id, type, ids),
    onSuccess: () => invalidate(queryClient, id),
  });
};

export const useRemoveAuditMember = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    AppError,
    { type: MemberType; memberId: string }
  >({
    mutationFn: ({ type, memberId }) => removeAuditMember(id, type, memberId),
    onSuccess: () => invalidate(queryClient, id),
  });
};

export const useUpdateAuditMember = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<
    void,
    AppError,
    {
      type: MemberType;
      memberId: string;
      input: { floorId?: number | null; label?: string };
    }
  >({
    mutationFn: ({ type, memberId, input }) =>
      updateAuditMember(id, type, memberId, input),
    onSuccess: () => invalidate(queryClient, id),
  });
};

export const useSetAuditFloors = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<void, AppError, string[]>({
    mutationFn: (names) => setAuditFloors(id, names),
    onSuccess: () => invalidate(queryClient, id),
  });
};

export interface EvaluationRunResult {
  batchId: string;
  total: number;
  byStatus: Record<string, number>;
  suggestedIssues: number;
  skippedIssues: number;
  recommendations: number;
  globalResult: string;
}

export const useRunEvaluation = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<EvaluationRunResult, AppError, undefined>({
    mutationFn: () => runEvaluation(id),
    onSuccess: () => invalidate(queryClient, id),
  });
};

export const useSyncAudit = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<
    Awaited<ReturnType<typeof syncAudit>>,
    AppError,
    undefined
  >({
    mutationFn: () => syncAudit(id),
    onSuccess: () => invalidate(queryClient, id),
  });
};

export const useDataQuality = (id: string) =>
  useQuery<DataQualityResult, AppError>({
    queryKey: [QUERY_KEYS.audits, id, "data-quality"],
    queryFn: () => getDataQuality(id),
    enabled: Boolean(id),
  });

export const useAuditEvaluations = (id: string) =>
  useQuery<AuditEvaluation[], AppError>({
    queryKey: [QUERY_KEYS.audits, id, "evaluations"],
    queryFn: () => getEvaluations(id),
    enabled: Boolean(id),
  });

// ---------- Informe ----------

export const useReportData = (id: string) =>
  useQuery<Record<string, unknown>, AppError>({
    queryKey: [QUERY_KEYS.audits, id, "report-data"],
    queryFn: () => getReportData(id),
    enabled: Boolean(id),
  });

export const useSaveReportVersion = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<{ version: number }, AppError, string[]>({
    mutationFn: (sections) => saveReportVersion(id, sections),
    onSuccess: () => invalidate(queryClient, id),
  });
};

// ---------- Checklist ----------

export const useAuditTests = (id: string) =>
  useQuery<AuditTest[], AppError>({
    queryKey: [QUERY_KEYS.audits, id, "tests"],
    queryFn: () => getAuditTests(id),
    enabled: Boolean(id),
  });

export const useUpdateAuditTest = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<
    AuditTest,
    AppError,
    { testId: string; status?: string; notes?: string }
  >({
    mutationFn: ({ testId, ...input }) => updateAuditTest(id, testId, input),
    onSuccess: () => invalidate(queryClient, id),
  });
};

export const useAddManualTest = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<AuditTest, AppError, { title: string; section: string }>({
    mutationFn: (input) => addManualTest(id, input),
    onSuccess: () => invalidate(queryClient, id),
  });
};

export const useDeleteAuditTest = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<void, AppError, string>({
    mutationFn: (testId) => deleteAuditTest(id, testId),
    onSuccess: () => invalidate(queryClient, id),
  });
};
