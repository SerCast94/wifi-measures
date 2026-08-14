import { Injectable } from "@nestjs/common";

import { Request, Response } from "express";

import { doubleCsrf } from "csrf-csrf";
import { AppConfigService } from "@config/app-config.service";

@Injectable()
export class CsrfService {
  private csrfProtection;

  constructor(private readonly config: AppConfigService) {
    this.csrfProtection = doubleCsrf({
      getSecret: () => this.config.get("csrfSecret"),
      cookieName: this.config.get("csrfCookieName"),
      cookieOptions: {
        httpOnly: true,
        secure: this.config.get("env") === "production",
        sameSite: "strict",
        maxAge: 3600 * 1000, // 1 hour
      },
      ignoredMethods: ["GET", "HEAD", "OPTIONS"],
      getTokenFromRequest: (req: Request) => {
        const fullToken = req.cookies[this.config.get("csrfCookieName")];
        if (!fullToken) return undefined;
        // Se elimina la firma adicional del token
        const token = fullToken.split("|")[0];
        return token;
      },
      errorConfig: {
        message: "invalid_csrf_token",
        statusCode: 403,
      },
    });
  }

  generateToken(req: Request, res: Response) {
    return this.csrfProtection.generateToken(req, res);
  }

  validateRequest(request: Request) {
    return this.csrfProtection.validateRequest(request);
  }

  getDoubleCsrfToken() {
    return this.csrfProtection.doubleCsrfProtection;
  }
}
