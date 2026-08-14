import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/core/atomic-components/dialog";
import { DialogDescription } from "@radix-ui/react-dialog";
import { DropzoneInputFile } from "@/core/atomic-components/dropzone-input-file";

interface UploadFileModalProps {
  open: boolean;
  onFileChange: (file: File | null) => void;
  onOpenChange?: (open: boolean) => void;
  dismissable?: boolean;
  title?: string;
  description?: string;
  placeholder?: string;
}

export default function UploadFileModal({
  open,
  onFileChange,
  onOpenChange = () => {},
  title = "Sube tu Archivo",
  description = "",
  dismissable = true,
}: UploadFileModalProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(open: boolean) => {
        if (!dismissable) return;
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <DropzoneInputFile onFileChange={onFileChange} />
      </DialogContent>
    </Dialog>
  );
}
