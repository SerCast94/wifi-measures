import {
  ArgumentsHost,
  BadRequestException,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from "@nestjs/common";

import { ApiProperty } from "@nestjs/swagger";

import { LoggerService } from "@core/logger/logger.service";
import { AppConfigService } from "@config/app-config.service";

export class ExceptionFormat {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: "2021-09-09T12:00:00.000Z" })
  timestamp: string;

  @ApiProperty({ example: "/api/v1/hello" })
  path: string;

  @ApiProperty({
    example: {
      email: ["email must be an email"],
      username: ["Username is required"],
    },
  })
  validationErrors?: Record<string, string[]>;

  @ApiProperty({
    example: "An internal server error occurred, please try again later",
  })
  message: string;

  @ApiProperty({ example: "INVALID_EMAIL" })
  errorToken?: string | string[];
}

interface IError {
  message?: string;
  error?: string | string[];
}

@Catch()
export class AllExceptionFilter implements ExceptionFilter {
  constructor(
    private readonly logger: LoggerService,
    private readonly config: AppConfigService
  ) {}
  async catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request: any = ctx.getRequest();

    const validationErrors =
      exception instanceof BadRequestException
        ? (exception.getResponse() as any).validationErrors || null
        : null;

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : (exception as Error).name === "ForbiddenError"
          ? HttpStatus.FORBIDDEN
          : HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      exception instanceof HttpException
        ? (exception.getResponse() as IError)
        : { message: (exception as Error).message, error: undefined };
    const responseData = {
      ...{
        statusCode: status,
        timestamp: new Date().toISOString(),
        path: request.url,
        validationErrors,
      },
      message:
        status >= HttpStatus.INTERNAL_SERVER_ERROR &&
        this.config.get("env") === "production"
          ? "An internal server error occurred, please try again later"
          : message.message,
      errorToken: message.error,
    };

    this.logMessage(request, message, status, exception, validationErrors);

    if (this.config.get("env") === "development") {
      await new Promise((resolve) =>
        setTimeout(resolve, this.config.get("delayResponse"))
      );
    }

    response.status(status).json(responseData);
  }

  private logMessage(
    request: any,
    message: IError,
    status: number,
    exception: any,
    validationErrors: any
  ) {
    const { message: errorMessage, error: errorToken } = message;
    if (status >= 500) {
      this.logger.error(
        `End Request for ${request.url}`,
        `method=${request.method} status=${status} errorToken=${
          errorToken ? errorToken : null
        } message=${errorMessage ? errorMessage : null}`,
        status >= 500 ? exception.stack : ""
      );
    } else {
      this.logger.warn(
        `End Request for ${request.url}`,
        `method=${request.method} status=${status} ${request.query ? `query=${JSON.stringify(request.query)}` : ""}
          ${request.body ? `body=${JSON.stringify(request.body)}` : ""} errorToken='${
            errorToken ? errorToken : null
          }' message='${errorMessage ? errorMessage : null}' ${
            validationErrors
              ? `validationErrors=${JSON.stringify(validationErrors)}`
              : ""
          }`
      );
    }
  }
}
