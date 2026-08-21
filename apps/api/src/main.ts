import { NestFactory } from "@nestjs/core";
import { VersioningType } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

import helmet from "helmet";
import express from "express";
import * as dotenv from "dotenv";
import session from "express-session";
import cookieParser from "cookie-parser";
import { useContainer } from "class-validator";

import { AppModule } from "./app.module";
import {
  AllExceptionFilter,
  ExceptionFormat,
} from "@core/exceptions/filters/exceptions.filter";
import { CsrfService } from "@core/csrf/csrf.service";
import { SeedService } from "@core/database/seed.service";
import {
  ResponseFormat,
  ResponseInterceptor,
} from "@core/responses/interceptors/response.interceptor";
import { LoggerService } from "@core/logger/logger.service";
import { AppConfigService } from "@config/app-config.service";
import { SessionService } from "@core/session/session.service";
import { LoggerInterceptor } from "@core/logger/interceptors/logger.interceptor";
import { validationPipe } from "@core/exceptions/pipes/validation.pipe";

dotenv.config();

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule);
    const config = app.get(AppConfigService);

    app.use(express.json({ limit: "50mb" }));
    app.use(express.urlencoded({ limit: "50mb", extended: true }));

    // Enable CORS
    app.enableCors({
      origin: [...config.get("allowedOrigins")],
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      credentials: true,
    });

    // Helmet Middleware
    app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            connectSrc: ["'self'", "localhost:*"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            fontSrc: ["'self'"],
            imgSrc: ["'self'", "data:", "https://*.tile.openstreetmap.org"],
          },
        },
        crossOriginResourcePolicy: { policy: "cross-origin" },
      })
    );

    // Session Middleware
    const sessionService = app.get(SessionService);
    app.use(
      session({
        ...sessionService.getConfig(),
      })
    );

    // Cookies Middleware
    app.use(cookieParser(config.get("cookieSecret")));

    // CSRF Middleware
    app.use(app.get(CsrfService).getDoubleCsrfToken());

    // Filters, Guards and Interceptors
    const logger = app.get(LoggerService);
    app.useGlobalInterceptors(new LoggerInterceptor(logger));
    app.useGlobalFilters(new AllExceptionFilter(logger, config));
    app.useGlobalInterceptors(new ResponseInterceptor(config));

    // pipes
    app.useGlobalPipes(validationPipe);
    useContainer(app.select(AppModule), { fallbackOnErrors: true });

    // global api prefix
    const globalPrefix = config.get("globalPrefix");
    app.setGlobalPrefix(globalPrefix);

    // Enable Versioning
    app.enableVersioning({
      defaultVersion: "1",
      type: VersioningType.URI,
    });

    // Swagger Config
    if (config.get("env") !== "production") {
      const swaggerConfig = new DocumentBuilder()
        .addBearerAuth()
        .setTitle(`${config.get("appName")}`)
        .setDescription(config.get("appDescription"))
        .setVersion(config.get("appVersion"))
        .build();
      const document = SwaggerModule.createDocument(app, swaggerConfig, {
        extraModels: [ResponseFormat, ExceptionFormat],
        deepScanRoutes: true,
      });
      SwaggerModule.setup("api", app, document);
    }

    // Seed Database
    await app.init();
    await app.get(SeedService).seed();

    // Start the app
    const port = config.get("port");
    const host = config.get("host");
    await app.listen(port, host);
  } catch (error) {
    console.error("Error al iniciar el servidor:", error);
    process.exit(1);
  }
}
bootstrap();
