import { Injectable } from "@nestjs/common";

import { DatabaseService } from "@core/database/database.service";

interface NormalizedAttachment {
  name: string;
  href: string;
}

/** Extrae y normaliza adjuntos del raw de Link-Live (formas variadas). */
export function normalizeAttachments(raw: unknown): NormalizedAttachment[] {
  const attachments = (raw as Record<string, unknown> | null)?.attachments;
  if (!Array.isArray(attachments)) return [];
  const out: NormalizedAttachment[] = [];
  for (const item of attachments) {
    if (typeof item === "string") {
      out.push({ name: item.split("/").pop() || item, href: item });
      continue;
    }
    if (item && typeof item === "object") {
      const record = item as Record<string, unknown>;
      const href = String(record.href ?? record.url ?? record.link ?? "");
      const name = String(
        record.name ?? record.filename ?? record.fileName ?? href.split("/").pop() ?? "archivo"
      );
      if (href) out.push({ name, href });
    }
  }
  return out;
}

@Injectable()
export class FilesService {
  constructor(private readonly database: DatabaseService) {}

  private get client() {
    return this.database.getClient();
  }

  /**
   * Adjuntos de Link-Live de todas las medidas, o solo de las vinculadas a
   * una auditoría cuando se indica auditId.
   */
  async listAttachments(auditId?: string) {
    const client = this.client;
    if (!client) return [];

    let measureFilter: Record<string, unknown> = {};
    if (auditId) {
      const links = await client.auditMeasure.findMany({
        where: { auditId },
        select: { measureId: true },
      });
      measureFilter = {
        id: {
          in: links.map((link: any) => link.measureId),
        },
      };
    }

    const measures = await client.medida.findMany({
      where: measureFilter,
      select: {
        id: true,
        idLinkLive: true,
        name: true,
        fechaHora: true,
        raw: true,
      },
      orderBy: { createdAt: "desc" },
      take: 500,
    });

    const rows: Array<{
      measureId: string;
      idLinkLive: string | null;
      measureName: string | null;
      fechaHora: Date | null;
      name: string;
      href: string;
    }> = [];
    for (const measure of measures) {
      for (const attachment of normalizeAttachments(measure.raw)) {
        rows.push({
          measureId: measure.id,
          idLinkLive: measure.idLinkLive,
          measureName: measure.name,
          fechaHora: measure.fechaHora,
          name: attachment.name,
          href: attachment.href,
        });
      }
    }
    return rows;
  }
}
