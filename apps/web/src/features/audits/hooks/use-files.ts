import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { QUERY_KEYS } from "@/config/constants";
import apiClient from "@/core/lib/apiClient";
import { handleApiError } from "@/core/lib/errorHandler";
import type { AppError } from "@/core/models/app-error";

export interface AttachmentRow {
  measureId: string;
  idLinkLive: string | null;
  measureName: string | null;
  fechaHora: string | null;
  name: string;
  href: string;
}

export interface AnexoItem {
  name: string;
  href: string;
  thumb?: string;
}

export const getAttachments = async (auditId?: string): Promise<AttachmentRow[]> => {
  try {
    const { data } = await apiClient.get<{ data: AttachmentRow[] }>(
      `v1/files/attachments`,
      { params: auditId ? { auditId } : undefined }
    );
    return data.data;
  } catch (error) {
    handleApiError(error);
  }
};

export const useAttachments = (auditId?: string) =>
  useQuery<AttachmentRow[], AppError>({
    queryKey: [QUERY_KEYS.audits, "attachments", auditId ?? "all"],
    queryFn: () => getAttachments(auditId),
  });

export const setAuditAnexos = async (
  id: string,
  items: AnexoItem[]
): Promise<void> => {
  try {
    await apiClient.put(`v1/audits/${id}/anexos`, { items });
  } catch (error) {
    handleApiError(error);
  }
};

export const useSetAnexos = (id: string) => {
  const queryClient = useQueryClient();
  return useMutation<void, AppError, AnexoItem[]>({
    mutationFn: (items) => setAuditAnexos(id, items),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.audits, id] }),
  });
};
