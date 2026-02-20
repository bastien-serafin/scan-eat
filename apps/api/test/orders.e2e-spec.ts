import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { OrdersController } from '../src/orders/orders.controller';
import { OrdersService } from '../src/orders/orders.service';
import { QrService } from '../src/qr/qr.service';

describe('OrdersController (e2e)', () => {
  let app: INestApplication;
  const qrService = new QrService();

  const ordersServiceMock = {
    create: jest.fn().mockResolvedValue({ id: 'order_1', status: 'NOUVELLE', total: 1000 }),
    getPublic: jest.fn().mockResolvedValue({ id: 'order_1', status: 'NOUVELLE' }),
    listAdmin: jest.fn().mockResolvedValue([]),
    updateStatus: jest.fn().mockResolvedValue({ id: 'order_1', status: 'EN_PREPA' }),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        { provide: OrdersService, useValue: ordersServiceMock },
        { provide: QrService, useValue: qrService },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('/public/orders/:id (GET) should return an order', async () => {
    const res = await request(app.getHttpServer()).get('/public/orders/order_1');
    expect(res.status).toBe(200);
    expect(res.body.id).toBe('order_1');
  });

  it('/public/establishments/:slug/orders (POST) should create order with valid QR', async () => {
    const exp = Date.now() + 60_000;
    const sig = qrService.sign({ slug: 'demo', tableId: 'table_1', exp });

    const res = await request(app.getHttpServer())
      .post('/public/establishments/demo/orders')
      .send({
        tableId: 'table_1',
        sig,
        exp: String(exp),
        paymentMode: 'SIMULATED',
        items: [{ productId: 'p1', qty: 1, chosenOptions: {} }],
      });

    expect(res.status).toBe(201);
    expect(res.body.id).toBe('order_1');
  });
});
