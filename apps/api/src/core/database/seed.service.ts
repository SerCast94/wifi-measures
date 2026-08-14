import { Injectable } from "@nestjs/common";

import { UsersSeeder } from "./seeders/users/users.seeder";
import { LoggerService } from "@core/logger/logger.service";

@Injectable()
export class SeedService {
  constructor(
    private readonly logger: LoggerService,
    private readonly usersSeeder: UsersSeeder
  ) {}

  async seed() {
    try {
      this.logger.log("[SEEDERS SERVICE]", "Starting seeding process...");

      await this.usersSeeder.seed();

      this.logger.log("[SEEDERS SERVICE]", "Seeding process completed!");
    } catch (error) {
      this.logger.error("Seeding process failed", error);
    }
  }
}
