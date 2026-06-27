// ponytail: HTTP proxy service — axios calls to downstream services through circuit breaker.
// 4xx downstream responses pass through to the client with their original status code;
// only 5xx and connection failures count toward opening the circuit.
// mTLS: for services in the MTLS set, an https.Agent with client cert is attached.
import { Injectable, Inject, HttpException, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { readFileSync } from 'fs';
import { Agent as HttpsAgent } from 'https';
import axios, { AxiosRequestConfig, Method } from 'axios';
import { Request } from 'express';
import { appConfig } from '../config/app.config';
import { CircuitBreakerService, CLIENT_ERROR_FLAG } from '../circuit-breaker/circuit-breaker.service';
import { CORRELATION_ID_HEADER } from '../middleware/correlation-id.middleware';

// ponytail: services that require mTLS client cert
const MTLS_SERVICES = new Set(['user']);

@Injectable()
export class HttpProxyService implements OnModuleInit {
  private readonly serviceUrls: Record<string, string>;
  private readonly logger = new Logger(HttpProxyService.name);
  private mtlsAgent: HttpsAgent | null = null;

  constructor(
    @Inject(appConfig.KEY) private readonly config: ConfigType<typeof appConfig>,
    private readonly circuitBreaker: CircuitBreakerService,
  ) {
    this.serviceUrls = this.config.SERVICE_URLS;
  }

  onModuleInit(): void {
    const m = this.config.MTLS;
    if (!m.enabled) return;
    try {
      const ca = readFileSync(m.caPath);
      const cert = readFileSync(m.clientCertPath);
      const key = readFileSync(m.clientKeyPath);
      this.mtlsAgent = new HttpsAgent({ ca, cert, key, rejectUnauthorized: true });
      this.logger.log(`mTLS enabled for services: ${[...MTLS_SERVICES].join(', ')}`);
    } catch (e) {
      // ponytail: fail loudly — silently downgrading to plaintext is worse than crashing
      throw new Error(`mTLS configured but cert files unreadable: ${(e as Error).message}`);
    }
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
    const userIdHeader = req?.headers['x-user-id'] as string | undefined;

    const axiosConfig: AxiosRequestConfig = {
      method,
      url: `${baseUrl}${path}`,
      data,
      params: method === 'GET' ? req?.query : undefined,
      headers: {
        'Content-Type': 'application/json',
        ...(correlationId ? { [CORRELATION_ID_HEADER]: correlationId } : {}),
        ...(userIdHeader ? { 'x-user-id': userIdHeader } : {}),
      },
    };

    // ponytail: attach mTLS agent for services that require client cert
    if (MTLS_SERVICES.has(serviceName) && this.mtlsAgent) {
      axiosConfig.httpsAgent = this.mtlsAgent;
    }

    return this.circuitBreaker.execute<T>(serviceName, async () => {
      const response = await axios({ ...axiosConfig, validateStatus: () => true });
      if (response.status >= 400) {
        // ponytail: re-throw with downstream status; tagged as client error so the
        // circuit breaker's errorFilter skips it
        const ex = new HttpException(response.data, response.status) as HttpException & Record<string, unknown>;
        ex[CLIENT_ERROR_FLAG] = true;
        throw ex;
      }
      // ponytail: 204/205 have empty bodies — return undefined so the controller's
      // @HttpCode(NONE) takes effect instead of Nest defaulting to 200
      if (response.status === 204 || response.status === 205) {
        return undefined as T;
      }
      return response.data as T;
    });
  }
}