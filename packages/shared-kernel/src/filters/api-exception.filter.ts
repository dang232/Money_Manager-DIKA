// ponytail: global exception filter — wraps all errors in ApiResponse.error()
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { ApiResponse } from '../response/api-response';
import { DomainException } from '../exceptions/domain.exception';
import { NotFoundException } from '../exceptions/not-found.exception';

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
      status = HttpStatus.BAD_REQUEST;
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
