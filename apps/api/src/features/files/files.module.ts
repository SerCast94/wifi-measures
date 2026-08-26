import { Module } from "@nestjs/common";

import { FilesService } from "./application/files.service";
import { FilesController } from "./presentation/http/files.controller";

@Module({
  controllers: [FilesController],
  providers: [FilesService],
})
export class FilesModule {}
