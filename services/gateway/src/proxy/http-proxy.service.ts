// ponytail: HTTP proxy service — axios calls to downstream services through circuit breaker
import { Injectable, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import axios, { AxiosRequestConfig, Method } from 'axios';
import { Request } from 'express';
import { appConfig } from '../config/app.config';
import { CircuitBreakerService } from '../circuit-breaker/circuit-breaker.service';
import { CORRELATION_ID_HEADER } from '../middleware/correlation-id.middleware';

@Injectable()
export class HttpProxyService {
  private readonly serviceUrls: Record<string, string>;

  constructor(
    @Inject(appConfig.KEY) private readonly config: ConfigType<typeof appConfig>,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {
    this.serviceUrls = this.config.SERVICE_URLS;
  }

  async request<T>(
    serviceName: string,
    method: Method,
    path: string,
    req?: Request,
    data?: unknown,
  ): Promise<T> {
    const baseUrl = this.serviceUrls[serviceName];
    if (!baseUrl) throw new Error(`Unknown service: ${serviceName}`);

    const correlationId = req?.headers[CORRELATION_ID_HEADER] as string | undefined;

    const axiosConfig: AxiosRequestConfig = {
      method,
      url: `${baseUrl}${path}`,
      data,
      params: method === 'GET' ? req?.query : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...(correlationId ? { [CORRELATION_ID_HEADER]: correlationId } : {}),
      },
    };

    return this.circuitBreaker.execute<T>(serviceName, async () => {
      const response = await axios(axiosConfig);
      return response.data as T;
    });
  }
}
