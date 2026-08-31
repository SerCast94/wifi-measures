import { Badge } from "@/core/atomic-components/badge";
import {
  LORA_AUDIT_STATUS_LABELS,
  LORA_AUDIT_STATUS_VARIANTS,
  type LoraAuditStatus,
} from "../types/lora.types";

const statusVariantMap = (status: LoraAuditStatus) =>
  LORA_AUDIT_STATUS_VARIANTS[status] ?? "secondary";

export const LoraAuditStatusBadge = ({ status }: { status: LoraAuditStatus }) => (
  <Badge variant={statusVariantMap(status)}>
    {LORA_AUDIT_STATUS_LABELS[status] ?? status}
  </Badge>
);
