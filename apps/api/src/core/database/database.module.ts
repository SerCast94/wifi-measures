import { Global, Module } from "@nestjs/common";

import { SeedService } from "./seed.service";
import { DatabaseService } from "./database.service";
import { UsersSeeder } from "./seeders/users/users.seeder";

@Global()
@Module({
  providers: [DatabaseService, SeedService, UsersSeeder],
  exports: [DatabaseService, SeedService],
})
export class DatabaseModule {}
