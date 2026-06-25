// ponytail: event relay — subscribes to domain events and pushes to WebSocket clients
import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { EventBusPort, DomainEvent } from '@money-manager/shared-kernel';
import { EVENT_BUS_PORT, CACHE_PORT } from '@money-manager/infrastructure';
import { CachePort } from '@money-manager/shared-kernel';
import { WsGateway } from './ws.gateway';

@Injectable()
export class EventRelayService implements OnModuleInit {
  constructor(
    @Inject(EVENT_BUS_PORT) private readonly eventBus: EventBusPort,
    @Inject(CACHE_PORT) private readonly cache: CachePort,
    private readonly wsGateway: WsGateway,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.eventBus.subscribe('transaction.created', 'gateway', async (event: DomainEvent) => {
      const userId = (event.payload as { userId?: string })?.userId || 'default';
      this.wsGateway.emitToUser(userId, 'transaction:created', event.payload);
      this.wsGateway.emitToUser(userId, 'dashboard:refresh', { reason: 'transaction.created' });
      await this.invalidateDashboardCache(userId);
    });

    await this.eventBus.subscribe('transaction.updated', 'gateway', async (event: DomainEvent) => {
      const userId = (event.payload as { userId?: string })?.userId || 'default';
      this.wsGateway.emitToUser(userId, 'transaction:updated', event.payload);
      this.wsGateway.emitToUser(userId, 'dashboard:refresh', { reason: 'transaction.updated' });
      await this.invalidateDashboardCache(userId);
    });

    await this.eventBus.subscribe('transaction.deleted', 'gateway', async (event: DomainEvent) => {
      const userId = (event.payload as { userId?: string })?.userId || 'default';
      this.wsGateway.emitToUser(userId, 'transaction:deleted', event.payload);
      this.wsGateway.emitToUser(userId, 'dashboard:refresh', { reason: 'transaction.deleted' });
      await this.invalidateDashboardCache(userId);
    });

    await this.eventBus.subscribe('budget.exceeded', 'gateway', async (event: DomainEvent) => {
      const userId = (event.payload as { userId?: string })?.userId || 'default';
      this.wsGateway.emitToUser(userId, 'budget:exceeded', event.payload);
    });

    await this.eventBus.subscribe('budget.updated', 'gateway', async (event: DomainEvent) => {
      const userId = (event.payload as { userId?: string })?.userId || 'default';
      this.wsGateway.emitToUser(userId, 'budget:updated', event.payload);
    });
  }

  private async invalidateDashboardCache(userId: string): Promise<void> {
    await this.cache.invalidate(`dashboard:${userId}:*`);
  }
}
