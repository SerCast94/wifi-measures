import { Controller, Get, Query } from "@nestjs/common";

import { ApiTags } from "@nestjs/swagger";

import { FilesService } from "../../application/files.service";

@Controller("files")
@ApiTags("Files")
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  /** Adjuntos de Link-Live (todas las medidas o las de una auditoría). */
  @Get("attachments")
  async attachments(@Query("auditId") auditId?: string) {
    return this.filesService.listAttachments(auditId || undefined);
  }
}
