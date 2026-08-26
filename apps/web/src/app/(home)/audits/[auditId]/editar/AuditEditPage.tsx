import { useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { PencilLineIcon } from "lucide-react";

import CustomLoading from "@/core/components/CustomLoading";
import AuditHeader from "../AuditHeader";
import AuditForm from "@/features/audits/components/AuditForm";
import { useAudit, useUpdateAudit } from "@/features/audits/hooks/use-audits";

const AuditEditPage = () => {
  const { auditId = "" } = useParams<{ auditId: string }>();
  const navigate = useNavigate();
  const { data: audit } = useAudit(auditId);
  const updateAudit = useUpdateAudit(auditId);

  if (!audit) return <CustomLoading />;

  return (
    <div className="container max-w-3xl px-2 py-2 mx-auto mb-4 sm:py-6 animate-in fade-in-0">
      <AuditHeader />
      <h1 className="flex gap-3 mb-6 text-lg font-bold sm:items-center">
        <PencilLineIcon className="w-5 h-5" />
        Editar auditoría
      </h1>

      <AuditForm
        initial={audit}
        submitLabel="Guardar cambios"
        pending={updateAudit.isPending}
        onCancelTo={`/audits/${auditId}`}
        onSubmit={async (input) => {
          await updateAudit.mutateAsync(input);
          toast.success("Auditoría actualizada.");
          navigate(`/audits/${auditId}`);
        }}
      />
    </div>
  );
};

export default AuditEditPage;
