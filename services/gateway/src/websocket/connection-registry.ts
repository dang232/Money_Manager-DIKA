// ponytail: WebSocket connection registry — userId to socketId mapping
import { Injectable } from '@nestjs/common';

@Injectable()
export class ConnectionRegistry {
  private readonly connections = new Map<string, Set<string>>();

  register(userId: string, socketId: string): void {
    const existing = this.connections.get(userId);
    if (existing) {
      existing.add(socketId);
    } else {
      this.connections.set(userId, new Set([socketId]));
    }
  }

  unregister(socketId: string): void {
    for (const [userId, sockets] of this.connections.entries()) {
      sockets.delete(socketId);
      if (sockets.size === 0) this.connections.delete(userId);
    }
  }

  getSocketIds(userId: string): string[] {
    const sockets = this.connections.get(userId);
    return sockets ? [...sockets] : [];
  }
}
