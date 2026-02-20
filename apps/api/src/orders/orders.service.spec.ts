import { OrderStatus } from '@prisma/client';
import { OrdersService } from './orders.service';

describe('OrdersService', () => {
  it('create should compute total and create order lines', async () => {
    const prisma: any = {
      establishment: { findUnique: jest.fn().mockResolvedValue({ id: 'est1', slug: 'demo' }) },
      locationTable: { findFirst: jest.fn().mockResolvedValue({ id: 't1', label: 'Table 1' }) },
      product: {
        findMany: jest.fn().mockResolvedValue([
          { id: 'p1', price: 1000, isActive: true },
          { id: 'p2', price: 500, isActive: true },
        ]),
      },
      order: {
        create: jest.fn().mockResolvedValue({
          id: 'o1',
          status: OrderStatus.NOUVELLE,
          total: 2500,
          items: [],
          table: { id: 't1', label: 'Table 1' },
        }),
      },
    };

    const gateway: any = {
      emitOrderCreated: jest.fn(),
      emitOrderUpdated: jest.fn(),
    };

    const service = new OrdersService(prisma, gateway);
    const order = await service.create('demo', 't1', [
      { productId: 'p1', qty: 2, chosenOptions: {} },
      { productId: 'p2', qty: 1, chosenOptions: {} },
    ] as any);

    expect(order.total).toBe(2500);
    expect(prisma.order.create).toHaveBeenCalled();
    expect(gateway.emitOrderCreated).toHaveBeenCalled();
  });
});
