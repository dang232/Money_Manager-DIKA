// ponytail: circuit-open filter — catches opossum open-circuit errors → 503
import { ExceptionFilter, Catch, ArgumentsHost } from '@nestjs/common';
import { Response } from 'express';

export class CircuitOpenError extends Error {
  constructor(message = 'Circuit breaker is open') {
    super(message);
    this.name = 'CircuitOpenError';
  }
}

@Catch(CircuitOpenError)
export class CircuitOpenFilter implements ExceptionFilter {
  catch(_exception: CircuitOpenError, host: ArgumentsHost): void {
    const res = host.switchToHttp().getResponse<Response>();
    res.status(503).json({
      message: 'Service temporarily unavailable',
      retryAfter: 30,
    });
  }
}
