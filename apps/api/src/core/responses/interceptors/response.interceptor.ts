import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";

import { Observable } from "rxjs";
import { delay, map } from "rxjs/operators";
import { ApiProperty } from "@nestjs/swagger";

import { AppConfigService } from "@config/app-config.service";

export class ResponseFormat<T> {
  @ApiProperty({ example: true })
  isArray: boolean;

  @ApiProperty({ example: "/api/hello" })
  path: string;

  @ApiProperty({ example: "10ms" })
  duration: string;

  @ApiProperty({ example: "GET" })
  method: string;

  data: T;
}

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ResponseFormat<T>>
{
  constructor(private readonly config: AppConfigService) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler
  ): Observable<ResponseFormat<T>> {
    const now = Date.now();
    const httpContext = context.switchToHttp();
    const request = httpContext.getRequest();

    return next.handle().pipe(
      delay(this.config.get("delayResponse")),
      map((data) => ({
        data,
        isArray: Array.isArray(data),
        quantity: Array.isArray(data) ? data.length : 1,
        path: request.path,
        duration: `${Date.now() - now}ms`,
        method: request.method,
      }))
    );
  }
}
