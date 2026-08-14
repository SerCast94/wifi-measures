import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";

import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

import { LoggerService } from "@core/logger/logger.service";

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  constructor(private readonly logger: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const now = Date.now();
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();

    const ip = this.getIP(request);

    this.logger.debug(
      `Incoming Request on ${request.url}`,
      `method=${request.method} ip=${ip} query=${JSON.stringify(request.query)}
      ${request.body ? `body=${JSON.stringify(request.body)}` : ""}`
    );

    return next.handle().pipe(
      tap(() => {
        this.logger.debug(
          `End Request for ${request.url}`,
          `method=${request.method} ip=${ip} duration=${Date.now() - now}ms`
        );
      })
    );
  }

  private getIP(request: any): string {
    let ip: string;
    const ipAddr = request.headers["x-forwarded-for"];
    if (ipAddr) {
      const list = ipAddr.split(",");
      ip = list[list.length - 1];
    } else {
      ip = request.socket.remoteAddress;
    }
    return ip.replace("::ffff:", "");
  }
}
