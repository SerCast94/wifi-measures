import { Module } from "@nestjs/common";

import { join } from "path";

// Core Modules
import { OdkModule } from "@core/odk/odk.module";
import { CsrfModule } from "@core/csrf/csrf.module";
import { AuthModule } from "@features/auth/auth.module";
import { ServeStaticModule } from "@nestjs/serve-static";
import { LoggerModule } from "@core/logger/logger.module";
import { AppCacheModule } from "@core/cache/cache.module";
import { UsersModule } from "@features/users/users.module";
import { AppConfigModule } from "@config/app-config.module";
import { CookiesModule } from "@core/cookies/cookies.module";
import { SessionModule } from "@core/session/session.module";
import { DatabaseModule } from "@core/database/database.module";
import { ResponsesModule } from "@core/responses/responses.module";
import { PasswordsModule } from "@core/passwords/passwords.module";
import { MeasuresModule } from "@features/measures/measures.module";
import { ExceptionsModule } from "@core/exceptions/exceptions.module";
import { ValidatorsModule } from "@core/validators/validators.module";

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(__dirname, "../../", "web/dist"),
    }),

    // Core Modules
    AppConfigModule,
    LoggerModule,
    ExceptionsModule,
    ResponsesModule,
    AppCacheModule,
    SessionModule,
    CookiesModule,
    CsrfModule,
    PasswordsModule,
    DatabaseModule,
    ValidatorsModule,
    OdkModule,

    // Feature Modules
    AuthModule,
    UsersModule,
    MeasuresModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
