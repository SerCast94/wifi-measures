import { Global, Module } from "@nestjs/common";

import { LoggerService } from "./logger.service";
import { LoggerRepository } from "./repositories/logger.repository";
import { LOGGER_REPOSITORY_TOKEN } from "./types/tokens";

@Global()
@Module({
  providers: [
    LoggerService,
    {
      provide: LOGGER_REPOSITORY_TOKEN,
      useClass: LoggerRepository,
    },
  ],
  exports: [LoggerService],
})
export class LoggerModule {}
