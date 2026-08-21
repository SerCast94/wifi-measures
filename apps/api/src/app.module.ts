import { Module } from "@nestjs/common";

import { join } from "path";

// Core Modules
import { CsrfModule } from "@core/csrf/csrf.module";
import { AuthModule } from "@features/auth/auth.module";
import { LinkLiveModule } from "@core/linklive/linklive.module";
import { ServeStaticModule } from "@nestjs/serve-static";
import { LoggerModule } from "@core/logger/logger.module";
import { AppCacheModule } from "@core/cache/cache.module";
import { UsersModule } from "@features/users/users.module";
import { AppConfigModule } from "@config/app-config.module";
import { CookiesModule } from "@core/cookies/cookies.module";
import { SessionModule } from "@core/session/session.module";
import { DatabaseModule } from "@core/database/database.module";
import { PasswordsModule } from "@core/passwords/passwords.module";
import { MeasuresModule } from "@features/measures/measures.module";
import { SurveysModule } from "@features/surveys/surveys.module";
import { AnalysesModule } from "@features/analyses/analyses.module";
import { NetAllyModule } from "@features/netally/netally.module";
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
    AppCacheModule,
    SessionModule,
    CookiesModule,
    CsrfModule,
    PasswordsModule,
    DatabaseModule,
    ValidatorsModule,
    LinkLiveModule,

    // Feature Modules
    AuthModule,
    UsersModule,
    MeasuresModule,
    SurveysModule,
    AnalysesModule,
    NetAllyModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
