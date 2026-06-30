// ponytail: global exception filter — wraps all errors in ApiResponse.error()
// Auth errors (401) and forbidden (403) are mapped from DomainException codes
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '../response/api-response';
import { DomainException } from '../exceptions/domain.exception';
import { NotFoundException } from '../exceptions/not-found.exception';

const AUTH_ERROR_CODES = new Set([
  'AUTH_INVALID_CREDENTIALS',
  'AUTH_TOKEN_INVALID',
  'AUTH_REFRESH_INVALID',
]);

const FORBIDDEN_ERROR_CODES = new Set([
  'FORBIDDEN',
  'NOT_AUTHORIZED',
]);

// ponytail: add new code sets here — keep sorted by HTTP semantics
const CONFLICT_ERROR_CODES = new Set([
  'USER_EMAIL_TAKEN',    // 409 — resource already exists
]);

const RATE_LIMIT_ERROR_CODES = new Set<string>([
  // 'RATE_LIMITED',     // 429 — add when error code is created
]);

@Catch()
export class ApiExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    let status: number;
    let code: string;
    let message: string;

    if (exception instanceof NotFoundException) {
      status = HttpStatus.NOT_FOUND;
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof DomainException) {
      // ponytail: map auth errors to 401, forbidden to 403, conflict to 409, everything else to 400
      if (AUTH_ERROR_CODES.has(exception.code)) {
        status = HttpStatus.UNAUTHORIZED;
      } else if (FORBIDDEN_ERROR_CODES.has(exception.code)) {
        status = HttpStatus.FORBIDDEN;
      } else if (CONFLICT_ERROR_CODES.has(exception.code)) {
        status = HttpStatus.CONFLICT;
      } else if (RATE_LIMIT_ERROR_CODES.has(exception.code)) {
        status = 429; // HttpStatus has no TOO_MANY_REQUESTS in older versions
      } else {
        status = HttpStatus.BAD_REQUEST;
      }
      code = exception.code;
      message = exception.message;
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      code = 'HTTP_ERROR';
      message = typeof res === 'string' ? res : (res as any).message || exception.message;
    } else {
      status = HttpStatus.INTERNAL_SERVER_ERROR;
      code = 'INTERNAL_ERROR';
      message = 'An unexpected error occurred';
    }

    response.status(status).json(
      ApiResponse.error(code, message, { correlationId: request.headers['x-correlation-id'] }),
    );
  }
}
