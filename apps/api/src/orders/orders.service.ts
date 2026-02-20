import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeGateway } from '../realtime/realtime.gateway';
import type { OrderStatus } from './dto/update-order-status.dto';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtimeGateway: RealtimeGateway,
  ) {}

  async create(
    slug: string,
    tableId: string,
    items: {
      productId: string;
      qty: number;
      notes?: string;
      chosenOptions: Prisma.InputJsonValue;
    }[],
  ) {
    const establishment = await this.prisma.establishment.findUnique({ where: { slug } });
    if (!establishment) {
      throw new NotFoundException('Etablissement introuvable');
    }

    const table = await this.prisma.locationTable.findFirst({ where: { id: tableId, establishmentId: establishment.id } });
    if (!table) {
      throw new BadRequestException('Table invalide');
    }

    const productIds = items.map((i) => i.productId);
    const products = await this.prisma.product.findMany({
      where: {
        id: { in: productIds },
        establishmentId: establishment.id,
        isActive: true,
      },
    });

    if (products.length !== productIds.length) {
      throw new BadRequestException('Un ou plusieurs produits sont invalides');
    }

    const priceByProduct = new Map(products.map((p) => [p.id, Number(p.price)]));
    const total = items.reduce(
      (sum, item) => sum + Number(priceByProduct.get(item.productId) ?? 0) * item.qty,
      0,
    );

    const order = await this.prisma.order.create({
      data: {
        establishmentId: establishment.id,
        tableId,
        total,
        status: 'NOUVELLE',
        items: {
          create: items.map((item) => ({
            productId: item.productId,
            qty: item.qty,
            unitPrice: Number(priceByProduct.get(item.productId) ?? 0),
            notes: item.notes,
            chosenOptions: item.chosenOptions,
          })),
        },
      },
      include: {
        establishment: true,
        table: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    this.realtimeGateway.emitOrderCreated(establishment.id, order);
    this.realtimeGateway.emitOrderUpdated(establishment.id, order.id, order);

    return order;
  }

  async getPublic(orderId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        establishment: true,
        table: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }

    return order;
  }

  async listAdmin(establishmentId: string) {
    return this.prisma.order.findMany({
      where: { establishmentId },
      orderBy: { createdAt: 'desc' },
      include: {
        establishment: true,
        table: true,
        items: {
          include: {
            product: true,
          },
        },
      },
      take: 200,
    });
  }

  async updateStatus(establishmentId: string, orderId: string, status: OrderStatus, seen?: boolean) {
    const current = await this.prisma.order.findFirst({ where: { id: orderId, establishmentId } });
    if (!current) {
      throw new NotFoundException('Commande introuvable');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status, seen: seen ?? current.seen },
      include: {
        table: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });

    this.realtimeGateway.emitOrderUpdated(establishmentId, orderId, updated);
    return updated;
  }
}
