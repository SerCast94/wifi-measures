import { Download, Image, FileText } from "lucide-react";

import type { UploadedFile } from "@/features/netally/types/netally.types";

const formatSize = (size: number | null): string => {
  if (size === null) return "—";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (date: string | null): string => {
  if (!date) return "—";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "—";
  return parsed.toLocaleString("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

export const UnitFiles = ({ files }: { files: UploadedFile[] }) => {
  if (files.length === 0) {
    return (
      <p className="py-2 text-sm text-muted-foreground">
        Esta unidad no tiene archivos subidos.
      </p>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-2 py-2 sm:grid-cols-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center gap-3 p-3 rounded-md border bg-muted/40"
        >
          <div className="flex items-center justify-center w-10 h-10 rounded-md bg-background shrink-0 overflow-hidden border border-border">
            {file.format === "image" && (file.thumb || file.mediumImage || file.href) ? (
              <img
                src={file.thumb || file.mediumImage || file.href || undefined}
                alt={file.name}
                className="w-full h-full object-cover"
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : file.format === "image" ? (
              <Image className="w-4 h-4" />
            ) : (
              <FileText className="w-4 h-4" />
            )}
          </div>
          <div className="flex-1 min-w-0 space-y-0.5">
            <p className="text-sm font-medium truncate" title={file.name}>
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {formatSize(file.size)} · {formatDate(file.uploadedAt)}
            </p>
          </div>
          {file.href && (
            <a
              href={file.href}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline shrink-0"
            >
              <Download className="w-4 h-4" />
              Descargar
            </a>
          )}
        </div>
      ))}
    </div>
  );
};