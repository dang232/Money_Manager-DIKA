// ponytail: global HTTP exception filter — uniform error format with correlation id
import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { CORRELATION_ID_HEADER } from '../middleware/correlation-id.middleware';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.message
        : 'Internal server error';

    const correlationId = req.headers[CORRELATION_ID_HEADER] as string | undefined;

    res.status(status).json({
      error: HttpStatus[status] || 'UNKNOWN_ERROR',
      message,
      statusCode: status,
      correlationId,
      timestamp: new Date().toISOString(),
    });
  }
}
