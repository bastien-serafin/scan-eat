import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({ namespace: '/realtime', cors: { origin: '*' } })
export class RealtimeGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    client.emit('connected', { ok: true });
  }

  @SubscribeMessage('join_establishment')
  joinEstablishment(@ConnectedSocket() client: Socket, @MessageBody() body: { establishmentId: string }) {
    client.join(`establishment:${body.establishmentId}`);
    return { ok: true };
  }

  @SubscribeMessage('join_order')
  joinOrder(@ConnectedSocket() client: Socket, @MessageBody() body: { orderId: string }) {
    client.join(`order:${body.orderId}`);
    return { ok: true };
  }

  emitOrderCreated(establishmentId: string, payload: unknown) {
    this.server.to(`establishment:${establishmentId}`).emit('order_created', payload);
  }

  emitOrderUpdated(establishmentId: string, orderId: string, payload: unknown) {
    this.server.to(`establishment:${establishmentId}`).emit('order_status_updated', payload);
    this.server.to(`order:${orderId}`).emit('order_status_updated', payload);
  }
}
