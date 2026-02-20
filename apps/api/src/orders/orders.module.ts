import { Module } from '@nestjs/common';
import { QrModule } from '../qr/qr.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

@Module({
  imports: [RealtimeModule, QrModule],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}
