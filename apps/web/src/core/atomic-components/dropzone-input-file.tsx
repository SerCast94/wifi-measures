import { UploadCloud, XCircle } from "lucide-react";
import React, { useState } from "react";

interface DropzoneInputFileProps {
  onFileChange: (file: File | null) => void;
}

export const DropzoneInputFile = ({ onFileChange }: DropzoneInputFileProps) => {
  const [fileName, setFileName] = useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const file = event.target.files[0];
      setFileName(file.name);
      onFileChange(file);
    }
  };

  const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      const file = event.dataTransfer.files[0];
      setFileName(file.name);
      onFileChange(file);
    }
  };

  const handleRemoveFile = () => {
    setFileName(null);
    onFileChange(null);
  };

  return (
    <div
      onDrop={handleDrop}
      onDragOver={(event) => event.preventDefault()}
      className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center h-[200px] cursor-pointer hover:border-gray-400 transition-colors"
    >
      <input
        type="file"
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
      />
      <label
        htmlFor="file-upload"
        className="flex flex-col items-center cursor-pointer"
      >
        <UploadCloud className="w-10 h-10 mb-2 text-muted-foreground" />
        <p className="text-sm text-center">
          {fileName ? (
            <>
              Archivo seleccionado:{" "}
              <span className="font-medium">{fileName}</span>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="ml-2 text-red-600 hover:text-red-800"
              >
                <XCircle className="inline w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              Arrastra y suelta tu archivo aquí o{" "}
              <span className="font-medium text-blue-600">
                haz clic para seleccionarlo
              </span>
            </>
          )}
        </p>
      </label>
    </div>
  );
};
