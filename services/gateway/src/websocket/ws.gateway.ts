// ponytail: WebSocket gateway — real-time events to connected clients
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConnectionRegistry } from './connection-registry';

@WebSocketGateway({ namespace: '/ws', cors: { origin: '*' } })
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly registry: ConnectionRegistry) {}

  handleConnection(client: Socket): void {
    const userId = client.handshake.query['userId'] as string || 'default';
    this.registry.register(userId, client.id);
  }

  handleDisconnect(client: Socket): void {
    this.registry.unregister(client.id);
  }

  emitToUser(userId: string, event: string, data: unknown): void {
    const socketIds = this.registry.getSocketIds(userId);
    for (const sid of socketIds) {
      this.server.to(sid).emit(event, data);
    }
  }
}
