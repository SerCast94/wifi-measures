import { AlertTriangle, CheckCircle2, CircleHelp, XCircle } from "lucide-react";

import { Badge } from "@/core/atomic-components/badge";
import {
  AUDIT_STATUS_LABELS,
  AUDIT_STATUS_VARIANTS,
  type AuditStatus,
  type EvaluationStatus,
  type IssueSeverity,
} from "../types/audit.types";

export const AuditStatusBadge = ({ status }: { status: AuditStatus }) => (
  <Badge variant={AUDIT_STATUS_VARIANTS[status] ?? "outline"}>
    {AUDIT_STATUS_LABELS[status] ?? status}
  </Badge>
);

export const EvalStatusBadge = ({ status }: { status: EvaluationStatus }) => {
  switch (status) {
    case "PASS":
      return (
        <Badge variant="success" className="gap-1">
          <CheckCircle2 className="h-3 w-3" /> Conforme
        </Badge>
      );
    case "WARNING":
      return (
        <Badge className="gap-1 border-transparent bg-amber-100 text-amber-900 hover:bg-amber-100">
          <AlertTriangle className="h-3 w-3" /> Límite
        </Badge>
      );
    case "FAIL":
      return (
        <Badge variant="destructive" className="gap-1">
          <XCircle className="h-3 w-3" /> No conforme
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary" className="gap-1">
          <CircleHelp className="h-3 w-3" /> No disponible
        </Badge>
      );
  }
};

const SEVERITY_STYLES: Record<IssueSeverity, string> = {
  CRITICAL: "border-transparent bg-red-200 text-red-950 hover:bg-red-200",
  HIGH: "border-transparent bg-orange-100 text-orange-900 hover:bg-orange-100",
  MEDIUM: "border-transparent bg-amber-100 text-amber-900 hover:bg-amber-100",
  LOW: "border-transparent bg-sky-100 text-sky-900 hover:bg-sky-100",
};

export const SeverityBadge = ({ severity }: { severity: IssueSeverity }) => (
  <Badge className={SEVERITY_STYLES[severity]}>{severity}</Badge>
);
