import { Injectable } from "@nestjs/common";

import { CookieParseOptions } from "cookie-parser";

import { AppConfigService } from "@config/app-config.service";

@Injectable()
export class CookiesService {
  constructor(private readonly config: AppConfigService) {}

  getSecret(): string {
    return this.config.get("cookieSecret");
  }

  getOptions(): CookieParseOptions {
    return {};
  }
}
