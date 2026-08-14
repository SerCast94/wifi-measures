import { Inject, Injectable } from "@nestjs/common";

import { ILogger } from "./types/logger";
import { LOGGER_REPOSITORY_TOKEN } from "./types/tokens";
import { AppConfigService } from "@config/app-config.service";

@Injectable()
export class LoggerService implements ILogger {
  private logLevel: string[];

  constructor(
    @Inject(LOGGER_REPOSITORY_TOKEN) private readonly logger: ILogger,
    private readonly config: AppConfigService
  ) {
    this.logLevel = this.config.get("logLevel");
  }

  debug(context: string, message: string) {
    if (this.logLevel.includes("debug") || this.logLevel.includes("all"))
      this.logger.debug(context, message);
  }

  log(context: string, message: string) {
    if (this.logLevel.includes("log") || this.logLevel.includes("all"))
      this.logger.log(context, message);
  }

  error(context: string, message: string, trace?: string) {
    if (this.logLevel.includes("error") || this.logLevel.includes("all"))
      this.logger.error(context, message, trace);
  }

  warn(context: string, message: string) {
    if (this.logLevel.includes("warn") || this.logLevel.includes("all"))
      this.logger.warn(context, message);
  }

  verbose(context: string, message: string) {
    if (this.logLevel.includes("verbose") || this.logLevel.includes("all"))
      this.logger.verbose(context, message);
  }
}
