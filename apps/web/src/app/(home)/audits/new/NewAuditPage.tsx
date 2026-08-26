import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ClipboardPlusIcon } from "lucide-react";

import AuditForm from "@/features/audits/components/AuditForm";
import { useCreateAudit } from "@/features/audits/hooks/use-audits";

const NewAuditPage = () => {
  const navigate = useNavigate();
  const createAudit = useCreateAudit();

  return (
    <div className="container max-w-3xl px-2 py-2 mx-auto mb-4 sm:py-6 animate-in fade-in-0">
      <h1 className="flex gap-3 mb-6 text-lg font-bold sm:text-2xl sm:items-center">
        <ClipboardPlusIcon className="w-6 h-6" />
        Nueva auditoría Wi-Fi
      </h1>

      <AuditForm
        submitLabel="Crear auditoría"
        pending={createAudit.isPending}
        onCancelTo="/audits"
        onSubmit={async (input) => {
          const audit = await createAudit.mutateAsync(input);
          toast.success("Auditoría creada.");
          navigate(`/audits/${audit.id}`);
        }}
      />
    </div>
  );
};

export default NewAuditPage;
