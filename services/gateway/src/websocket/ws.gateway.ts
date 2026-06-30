// ponytail: WebSocket gateway — real-time events to connected clients
import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import { ConnectionRegistry } from './connection-registry';

const DEV_FALLBACK_SECRET = 'dev-only-secret-please-replace-in-production-32chars';

@WebSocketGateway({ namespace: '/ws', cors: { origin: process.env['FRONTEND_URL'] || 'http://localhost:5173', credentials: true } })
export class WsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(WsGateway.name);
  private readonly secret: string;

  constructor(private readonly registry: ConnectionRegistry) {
    const envSecret = process.env['JWT_SECRET'];
    this.secret = envSecret && envSecret.length >= 16 ? envSecret : DEV_FALLBACK_SECRET;
  }

  handleConnection(client: Socket): void {
    // ponytail: verify mm-at cookie on WS handshake — reject unauthenticated connections
    const cookieHeader = client.handshake.headers['cookie'] || '';
    const match = cookieHeader.match(/(?:^|;\s*)mm-at=([^;]+)/);
    const token = match?.[1];

    if (!token) {
      this.logger.warn(`WS connection rejected — no mm-at cookie (socketId=${client.id})`);
      client.disconnect(true);
      return;
    }

    try {
      const decoded = jwt.verify(token, this.secret, { algorithms: ['HS256'] }) as jwt.JwtPayload;
      const userId = typeof decoded.sub === 'string' ? decoded.sub : 'default';
      this.registry.register(userId, client.id);
    } catch {
      this.logger.warn(`WS connection rejected — invalid mm-at token (socketId=${client.id})`);
      client.disconnect(true);
    }
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
