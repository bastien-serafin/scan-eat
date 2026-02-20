import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { QrService } from '../qr/qr.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrdersService } from './orders.service';

@Controller()
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly qrService: QrService,
  ) {}

  @Post('public/establishments/:slug/orders')
  @Throttle({ default: { limit: 8, ttl: 60_000 } })
  async createOrder(@Param('slug') slug: string, @Body() body: CreateOrderDto) {
    this.qrService.verify({
      slug,
      tableId: body.tableId,
      exp: Number(body.exp),
      sig: body.sig,
    });

    if (body.paymentMode === 'STRIPE' && process.env.STRIPE_ENABLED !== 'true') {
      throw new BadRequestException('Paiement Stripe désactivé');
    }

    return this.ordersService.create(
      slug,
      body.tableId,
      body.items.map((item) => ({
        productId: item.productId,
        qty: item.qty,
        notes: item.notes,
        chosenOptions: ((item.chosenOptions ?? {}) as unknown) as Prisma.JsonValue,
      })),
    );
  }

  @Get('public/orders/:orderId')
  getOrder(@Param('orderId') orderId: string) {
    return this.ordersService.getPublic(orderId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('admin/orders')
  listOrders(@Req() req: Request) {
    const user = req.user as { establishmentId: string } | undefined;
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.ordersService.listAdmin(user.establishmentId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('admin/orders/:orderId/status')
  updateOrderStatus(
    @Req() req: Request,
    @Param('orderId') orderId: string,
    @Body() body: UpdateOrderStatusDto,
  ) {
    const user = req.user as { establishmentId: string } | undefined;
    if (!user) {
      throw new UnauthorizedException();
    }

    return this.ordersService.updateStatus(user.establishmentId, orderId, body.status, body.seen);
  }
}
