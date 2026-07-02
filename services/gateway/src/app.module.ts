// ponytail: gateway app module — wires all providers, controllers, middleware
import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventBusModule, CacheModule, LoggerModule } from '@money-manager/infrastructure';
import { appConfig } from './config/app.config';
import { CorrelationIdMiddleware } from './middleware/correlation-id.middleware';
import { JwtAuthMiddleware } from './middleware/jwt-auth.middleware';
import { CsrfMiddleware } from './middleware/csrf.middleware';
import { CircuitBreakerService } from './circuit-breaker/circuit-breaker.service';
import { HttpProxyService } from './proxy/http-proxy.service';
import { TransactionProxyController } from './proxy/transaction-proxy.controller';
import { BudgetProxyController, CategoryProxyController } from './proxy/budget-proxy.controller';
import { AiProxyController } from './proxy/ai-proxy.controller';
import { AuthProxyController } from './proxy/auth-proxy.controller';
import { UsersProxyController, LayoutProxyController } from './proxy/users-proxy.controller';
import { DashboardController } from './proxy/dashboard.controller';
import { HealthController } from './health/health.controller';
import { WsGateway } from './websocket/ws.gateway';
import { ConnectionRegistry } from './websocket/connection-registry';
import { EventRelayService } from './websocket/event-relay.service';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [appConfig] }),
    LoggerModule,
    EventBusModule.forRoot({
      redis: {
        host: process.env['REDIS_HOST'] ?? 'localhost',
        port: Number(process.env['REDIS_PORT'] ?? 6379),
        password: process.env['REDIS_PASSWORD'],
      },
    }),
    CacheModule.forRoot({
      host: process.env['REDIS_HOST'] ?? 'localhost',
      port: Number(process.env['REDIS_PORT'] ?? 6379),
      password: process.env['REDIS_PASSWORD'],
    }),
  ],
  controllers: [
    TransactionProxyController,
    BudgetProxyController,
    CategoryProxyController,
    AiProxyController,
    AuthProxyController,
    UsersProxyController,
    LayoutProxyController,
    DashboardController,
    HealthController,
  ],
  providers: [
    CircuitBreakerService,
    HttpProxyService,
    ConnectionRegistry,
    WsGateway,
    EventRelayService,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    // ponytail: middleware order matters — correlation-id first, then JWT (sets x-user-id), then CSRF check
    consumer.apply(CorrelationIdMiddleware).forRoutes('*');
    consumer.apply(JwtAuthMiddleware).forRoutes('*');
    consumer.apply(CsrfMiddleware).forRoutes('*');
  }
}
