import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from "@nestjs/common";

import { AppConfigService } from "@config/app-config.service";

@Injectable()
export class DatabaseService implements OnModuleInit, OnModuleDestroy {
  private client: any | null = null;
  private readonly logger = new Logger(DatabaseService.name);

  constructor(private readonly config: AppConfigService) {}

  async onModuleInit() {
    try {
      // require at runtime so missing generated client doesn't break startup
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const { PrismaClient } = require("@prisma/client");
      this.client = new PrismaClient();
      await this.client.$connect();
      this.logger.log("Connected to database via Prisma client");
    } catch (error: any) {
      this.client = null;
      this.logger.warn(
        `Prisma client not available; continuing without DB. Reason: ${
          error?.message ?? error
        }`
      );
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.$disconnect();
    }
  }

  getClient() {
    return this.client;
  }

  // Additional method to clear the database (used in tests)
  async clearDatabase() {
    if (this.config.get("env") === "test" && this.client) {
      await this.client.$transaction([]);
    }
  }
}
