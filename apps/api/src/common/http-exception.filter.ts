import { ArgumentsHost, Catch, HttpException, HttpStatus } from "@nestjs/common";
import type { ExceptionFilter } from "@nestjs/common";
import type { Response } from "express";
import { randomUUID } from "node:crypto";

@Catch()
export class HttpExceptionEnvelopeFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : HttpStatus.INTERNAL_SERVER_ERROR;
    const raw = exception instanceof HttpException ? exception.getResponse() : null;
    const object = typeof raw === "object" && raw !== null ? raw as Record<string, unknown> : {};
    const message = typeof object.message === "string"
      ? object.message
      : typeof raw === "string"
        ? raw
        : status === 500 ? "Internal server error" : "Request failed";
    response.status(status).json({
      data: null,
      error: {
        code: typeof object.code === "string" ? object.code : `HTTP_${status}`,
        message,
        ...(object.details ? { details: object.details } : {})
      },
      requestId: randomUUID()
    });
  }
}
