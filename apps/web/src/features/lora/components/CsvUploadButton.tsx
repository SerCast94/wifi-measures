import { useRef } from "react";
import { UploadCloudIcon } from "lucide-react";

import { Button } from "@/core/atomic-components/button";

interface CsvUploadButtonProps {
  onParsed: (text: string, fileName: string) => void;
  accept?: string;
  label?: string;
  disabled?: boolean;
  multiple?: boolean;
}

export const CsvUploadButton = ({
  onParsed,
  accept = ".csv,text/csv",
  label = "Cargar CSV",
  disabled,
  multiple = false,
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
        multiple={multiple}
        className="hidden"
        onChange={(event) => {
          const files = event.target.files
            ? Array.from(event.target.files)
            : [];
          for (const file of files) handleFile(file);
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
