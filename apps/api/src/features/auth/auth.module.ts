import { APP_GUARD } from "@nestjs/core";
import { Global, Module } from "@nestjs/common";

import { AuthService } from "./application/auth.service";
import { AUTH_REPOSITORY_TOKEN } from "./domain/config/tokens";
import { DatabaseModule } from "@core/database/database.module";
import { RolesGuard } from "./presentation/http/guards/roles.guard";
import { AuthController } from "./presentation/http/auth.controller";
import { PermissionsGuard } from "./presentation/http/guards/permissions.guard";
import { DatabaseAuthRepository } from "./infrastructure/repositories/database-auth.repository";

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [
    {
      provide: AUTH_REPOSITORY_TOKEN,
      useClass: DatabaseAuthRepository,
    },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    AuthService,
  ],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
