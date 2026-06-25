// ponytail: correlation-id middleware — propagates trace id across service calls
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { generateCorrelationId } from '@money-manager/shared-kernel';

export const CORRELATION_ID_HEADER = 'x-correlation-id';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction): void {
    const existing = req.headers[CORRELATION_ID_HEADER] as string | undefined;
    const correlationId = existing || generateCorrelationId();

    req.headers[CORRELATION_ID_HEADER] = correlationId;
    res.setHeader(CORRELATION_ID_HEADER, correlationId);

    next();
  }
}
