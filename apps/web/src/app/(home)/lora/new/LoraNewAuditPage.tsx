import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ClipboardPlusIcon } from "lucide-react";

import { LoraAuditForm } from "@/features/lora/components/LoraAuditForm";
import { useCreateLoraAudit } from "@/features/lora/hooks/use-lora";

const LoraNewAuditPage = () => {
  const navigate = useNavigate();
  const createAudit = useCreateLoraAudit();

  return (
    <div className="container max-w-3xl px-2 py-2 mx-auto mb-4 sm:py-6 animate-in fade-in-0">
      <h1 className="flex items-center gap-3 mb-6 text-lg font-bold sm:text-2xl">
        <ClipboardPlusIcon className="w-6 h-6" />
        Nueva auditoría LoRa
      </h1>

      <LoraAuditForm
        submitLabel="Crear auditoría"
        pending={createAudit.isPending}
        onCancelTo="/lora"
        onSubmit={async (input) => {
          const audit = await createAudit.mutateAsync(input);
          toast.success("Auditoría creada.");
          navigate(`/lora/${audit.id}`);
        }}
      />
    </div>
  );
};

export default LoraNewAuditPage;
