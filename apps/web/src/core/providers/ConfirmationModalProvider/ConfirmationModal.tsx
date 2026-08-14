import { useState } from "react";

import { AlertTriangleIcon, CheckCircle, XCircle } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/core/atomic-components/dialog";
import { LoadingButton } from "@/core/atomic-components/loading-button";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  question: string;
  onConfirm: () => Promise<void>;
}

const ConfirmationModal = ({
  isOpen,
  onClose,
  title,
  question,
  onConfirm,
}: ConfirmationModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleConfirm = async () => {
    setLoading(true);
    setError("");

    try {
      await onConfirm();
      onClose();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      if (err.formErrors) {
        const validationMessage = Object.values(
          err.formErrors
        ).flat() as string[];
        setError(validationMessage.length > 0 ? validationMessage[0] : "");
      } else {
        setError(err?.message || "Algo salió mal, intenta nuevamente.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    if (error) setError("");
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            <div className="flex items-center space-x-2">
              <AlertTriangleIcon className="w-6 h-6 text-yellow-500 dark:text-yellow-400" />
              <span className="text-lg font-semibold">{title}</span>
            </div>
          </DialogTitle>
        </DialogHeader>
        <DialogDescription>Por favor, confirma tu acción.</DialogDescription>
        <div className="space-y-4">
          <p>{question}</p>
          {error && <p className="text-red-500">{error}</p>}
        </div>
        <DialogFooter>
          <LoadingButton
            loading={loading}
            variant="ghost"
            className="hover:!bg-transparent hover:!text-red-500 dark:hover:!text-red-300"
            onClick={handleClose}
            disabled={loading}
            icon={<XCircle className="w-5 h-5 mr-1" />}
          >
            Cancelar
          </LoadingButton>
          <LoadingButton
            loading={loading}
            onClick={handleConfirm}
            disabled={loading}
            icon={<CheckCircle className="w-5 h-5 mr-1" />}
          >
            Confirmar
          </LoadingButton>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ConfirmationModal;
