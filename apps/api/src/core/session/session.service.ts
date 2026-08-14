import { Global, Injectable } from "@nestjs/common";

import { SessionOptions } from "express-session";

import { AppConfigService } from "@config/app-config.service";
import { KeyvSessionStore } from "./store/keyv-session-store";

@Global()
@Injectable()
export class SessionService {
  constructor(private readonly config: AppConfigService) {}

  getConfig(): SessionOptions {
    return {
      secret: this.config.get("sessionSecret"),
      name: this.config.get("sessionCookieName"),
      resave: false,
      saveUninitialized: false,
      cookie: {
        path: "/",
        httpOnly: true,
        maxAge: this.config.get("sessionExpiration") * 1000,
        sameSite: "strict",
      },
      proxy: this.config.get("env") === "production",
      store: new KeyvSessionStore(
        `redis://${this.config.get("redisHost")}:${this.config.get(
          "redisPort"
        )}`,
        this.config.get("redisPassword") as string
      ),
    };
  }
}
