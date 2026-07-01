// ponytail: event relay — subscribes to domain events and pushes to WebSocket clients
import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { EventBusPort, DomainEvent } from '@money-manager/shared-kernel';
import { EVENT_BUS_PORT, CACHE_PORT } from '@money-manager/shared-kernel';
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
    // Subscribe to transaction.events topic and filter by eventType
    await this.eventBus.subscribe('transaction.events', 'gateway', async (event: DomainEvent) => {
      const userId = this.extractUserId(event) || 'default';

      if (event.eventType === 'transaction.created') {
        this.wsGateway.emitToUser(userId, 'transaction.created', event);
        this.wsGateway.emitToUser(userId, 'dashboard:refresh', { reason: 'transaction.created' });
        await this.invalidateDashboardCache(userId);
      } else if (event.eventType === 'transaction.updated') {
        this.wsGateway.emitToUser(userId, 'transaction.updated', event);
        this.wsGateway.emitToUser(userId, 'dashboard:refresh', { reason: 'transaction.updated' });
        await this.invalidateDashboardCache(userId);
      } else if (event.eventType === 'transaction.deleted') {
        this.wsGateway.emitToUser(userId, 'transaction.deleted', event);
        this.wsGateway.emitToUser(userId, 'dashboard:refresh', { reason: 'transaction.deleted' });
        await this.invalidateDashboardCache(userId);
      }
    });

    // Subscribe to budget.events topic and filter by eventType
    await this.eventBus.subscribe('budget.events', 'gateway', async (event: DomainEvent) => {
      const userId = this.extractUserId(event) || 'default';

      if (event.eventType === 'budget.exceeded') {
        this.wsGateway.emitToUser(userId, 'budget.exceeded', event);
      } else if (event.eventType === 'budget.updated') {
        this.wsGateway.emitToUser(userId, 'budget.updated', event);
        await this.invalidateDashboardCache(userId);
      }
    });
  }

  private extractUserId(event: DomainEvent): string {
    // Try to extract userId from event directly (event properties)
    const userId = (event as any).userId ||
                    (event.payload && (event.payload as any).userId) ||
                    'default';
    return userId === 'default' ? 'default' : String(userId);
  }

  private async invalidateDashboardCache(userId: string): Promise<void> {
    await this.cache.invalidate(`dashboard:${userId}:*`);
  }
}
