import { FileImage, Paperclip } from "lucide-react";

import { Card, CardContent } from "@/core/atomic-components/card";
import { UnitFiles } from "@/features/netally/components/units/UnitFiles";
import { useUnits } from "@/features/netally/hooks/use-units";
import type { MeasureModel } from "@/features/measures/models/measure.model";

interface ArchivosTabProps {
  measure: MeasureModel;
}

interface Attachment {
  name?: string;
  fileName?: string;
  href?: string;
  url?: string;
}

const normalizeAttachments = (input: unknown): Attachment[] => {
  if (!Array.isArray(input)) return [];
  return input.filter(
    (entry): entry is Attachment =>
      Boolean(entry) && typeof entry === "object"
  );
};

export const ArchivosTab = ({ measure }: ArchivosTabProps) => {
  const raw = (measure.raw ?? {}) as Record<string, unknown>;
  const unitKey = (raw.unit_id ?? raw.unit_mac ?? null) as string | null;

  const { data: units, isLoading, isError } = useUnits();

  const unit = units?.find(
    (candidate) => candidate.id === unitKey || candidate.mac === unitKey
  );

  const attachments = normalizeAttachments(raw.attachments);

  if (isLoading) {
    return (
      <Card>
        <CardContent className="mt-4 text-sm text-muted-foreground">
          Cargando archivos…
        </CardContent>
      </Card>
    );
  }

  const hasNothing =
    !unit && attachments.length === 0;

  if (isError || hasNothing) {
    return (
      <Card>
        <CardContent className="mt-4 text-sm text-muted-foreground">
          No hay archivos asociados a esta medida.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {attachments.length > 0 && (
        <Card>
          <CardContent className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <Paperclip className="w-4 h-4" />
              <p className="text-sm font-medium">
                Adjuntos del resultado ({attachments.length})
              </p>
            </div>
            <ul className="space-y-1">
              {attachments.map((attachment, index) => {
                const label =
                  attachment.name ?? attachment.fileName ?? `Adjunto ${index + 1}`;
                const url = attachment.href ?? attachment.url;
                return (
                  <li key={`${label}-${index}`} className="text-sm">
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {label}
                      </a>
                    ) : (
                      label
                    )}
                  </li>
                );
              })}
            </ul>
          </CardContent>
        </Card>
      )}

      {unit && (
        <Card>
          <CardContent className="mt-4">
            <div className="flex items-center gap-2 mb-2">
              <FileImage className="w-4 h-4" />
              <p className="text-sm font-medium">
                Archivos subidos por {unit.name}
              </p>
            </div>
            <UnitFiles files={unit.files} />
          </CardContent>
        </Card>
      )}
    </div>
  );
};
