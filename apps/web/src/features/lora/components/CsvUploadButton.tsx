import { useRef } from "react";
import { UploadCloudIcon } from "lucide-react";

import { Button } from "@/core/atomic-components/button";

interface CsvUploadButtonProps {
  onParsed: (text: string, fileName: string) => void;
  accept?: string;
  label?: string;
  disabled?: boolean;
}

export const CsvUploadButton = ({
  onParsed,
  accept = ".csv,text/csv",
  label = "Cargar CSV",
  disabled,
}: CsvUploadButtonProps) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      onParsed(String(reader.result ?? ""), file.name);
    };
    reader.readAsText(file);
  };

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) handleFile(file);
          event.target.value = "";
        }}
      />
      <Button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={disabled}
      >
        <UploadCloudIcon className="w-4 h-4 mr-1" /> {label}
      </Button>
    </>
  );
};
