// ponytail: circuit breaker service — opossum wrapper per downstream service
import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import CircuitBreaker from 'opossum';
import winston from 'winston';
import { appConfig } from '../config/app.config';
import { LOGGER_TOKEN } from '@money-manager/shared-kernel';

@Injectable()
export class CircuitBreakerService {
  private readonly breakers = new Map<string, CircuitBreaker>();

  constructor(
    @Inject(appConfig.KEY) private readonly config: ConfigType<typeof appConfig>,
    @Inject(LOGGER_TOKEN) private readonly logger: winston.Logger,
  ) {}

  getBreaker(serviceName: string): CircuitBreaker {
    const existing = this.breakers.get(serviceName);
    if (existing) return existing;

    const breaker = new CircuitBreaker(
      (fn: () => Promise<unknown>) => fn(),
      {
        timeout: this.config.CIRCUIT_BREAKER.timeout,
        errorThresholdPercentage: this.config.CIRCUIT_BREAKER.errorThresholdPercentage,
        resetTimeout: this.config.CIRCUIT_BREAKER.resetTimeout,
      },
    );

    breaker.on('open', () => this.logger.warn(`Circuit OPEN: ${serviceName}`));
    breaker.on('halfOpen', () => this.logger.info(`Circuit HALF-OPEN: ${serviceName}`));
    breaker.on('close', () => this.logger.info(`Circuit CLOSED: ${serviceName}`));

    this.breakers.set(serviceName, breaker);
    return breaker;
  }

  async execute<T>(serviceName: string, fn: () => Promise<T>): Promise<T> {
    const breaker = this.getBreaker(serviceName);
    return breaker.fire(fn) as Promise<T>;
  }
}
