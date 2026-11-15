import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { AllExceptionsFilter } from '../src/common/filters/http-exception.filter';
import { TransformInterceptor } from '../src/common/interceptors/transform.interceptor';

const API_GLOBAL_PREFIX = 'api';
const API_PREFIX_EXCLUDES = ['health', 'api/health'];

describe('BrewLite NestJS HTTP Integration Suite (/api)', () => {
  let app: INestApplication;
  let customerToken = '';
  let customer2Token = '';
  let createdOrderId = '';
  let testVariantId = 'var-001-m';
  let testProductId = 'prod-001';
  let expectedDiscount = 7000;
  const idempotencyKey = `INTEG_KEY_${Date.now()}`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix(API_GLOBAL_PREFIX, {
      exclude: API_PREFIX_EXCLUDES,
    });
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
      }),
    );
    app.useGlobalFilters(new AllExceptionsFilter());
    app.useGlobalInterceptors(new TransformInterceptor());
    await app.init();

    const prisma = app.get(PrismaService);
    const sampleVariant = await prisma.productVariant.findFirst({
      include: { product: true },
    });
    if (sampleVariant) {
      testVariantId = sampleVariant.id;
      testProductId = sampleVariant.productId;
      expectedDiscount = Math.round((Number(sampleVariant.price) * 2 * 10) / 100);
      if (expectedDiscount > 15000) expectedDiscount = 15000;
    }
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('IT-00: GET /api/health trả thông tin sức khỏe API (200), route không tồn tại vẫn 404', async () => {
    const healthRes = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(healthRes.body?.success).toBe(true);
    expect(healthRes.body?.data?.status).toBe('ok');

    await request(app.getHttpServer()).get('/unknown-route').expect(404);
    await request(app.getHttpServer()).get('/api/unknown-route').expect(404);
  });

  it('IT-01: GET /health và GET /api/health trả trạng thái ok', async () => {
    const healthRes = await request(app.getHttpServer()).get('/health').expect(200);
    expect(healthRes.body?.data?.status || healthRes.body?.status).toBe('ok');

    const res = await request(app.getHttpServer()).get('/api/health').expect(200);
    expect(res.body?.data?.status || res.body?.status).toBe('ok');
  });

  it('IT-02: POST /api/auth/login từ chối DTO không hợp lệ (400 Bad Request)', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: '', password: '' })
      .expect(400);
  });

  it('IT-03: POST /api/auth/login cấp JWT hợp lệ (expiresIn: 900s = 15m) cho customer1 & customer2', async () => {
    const res1 = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'customer1', password: '123456' })
      .expect(200);

    const payload1 = res1.body?.data || res1.body;
    expect(payload1.accessToken).toBeTruthy();
    expect(payload1.expiresIn).toBe(900);
    customerToken = payload1.accessToken;

    const res2 = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ username: 'customer2', password: '123456' })
      .expect(200);

    const payload2 = res2.body?.data || res2.body;
    expect(payload2.accessToken).toBeTruthy();
    customer2Token = payload2.accessToken;
  });

  it('IT-04: GET /api/promotions/available?subtotal=50000 trả discountValue BANMOI = 15000', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/promotions/available?subtotal=50000')
      .expect(200);

    const list = res.body?.data || res.body;
    expect(Array.isArray(list)).toBe(true);
    const banMoi = list.find((v: any) => v.code === 'BANMOI');
    expect(banMoi).toBeDefined();
    expect(banMoi.discountValue).toBe(15000);
    expect(banMoi.isEligible).toBe(true);
  });

  it('IT-05: POST /api/orders chặn unauthenticated (401) và chặn stacking 2 mã ORDER_DISCOUNT (400)', async () => {
    await request(app.getHttpServer())
      .post('/api/orders')
      .send({ items: [{ variantId: testVariantId, quantity: 2 }] })
      .expect(401);

    await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        items: [{ variantId: testVariantId, quantity: 2 }],
        promotionCode: 'BREW10,GIAM20K',
      })
      .expect(400);
  });

  it('IT-06: POST /api/orders -> POST /api/payments (201) -> Idempotent Replay (200) -> Key conflict (422)', async () => {
    const orderRes = await request(app.getHttpServer())
      .post('/api/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({
        items: [{ variantId: testVariantId, quantity: 2 }],
        promotionCode: 'BREW10',
      })
      .expect(201);

    const order = orderRes.body?.data || orderRes.body;
    expect(order.id).toBeTruthy();
    expect(order.status).toBe('PENDING');
    expect(Number(order.discountAmount)).toBeGreaterThan(0);
    createdOrderId = order.id;

    const payRes1 = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({ orderId: createdOrderId, method: 'WALLET' })
      .expect(201);

    const payBody1 = payRes1.body?.data || payRes1.body;
    expect(payBody1.success).toBe(true);

    const payRes2 = await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({ orderId: createdOrderId, method: 'WALLET' })
      .expect(200);

    const payBody2 = payRes2.body?.data || payRes2.body;
    expect(payBody2.replayed).toBe(true);

    await request(app.getHttpServer())
      .post('/api/payments')
      .set('Authorization', `Bearer ${customerToken}`)
      .set('Idempotency-Key', idempotencyKey)
      .send({ orderId: createdOrderId, method: 'CARD' })
      .expect(422);
  });

  it('IT-07: RBAC chặn CUSTOMER truy cập Barista endpoint GET /api/staff/orders (403 Forbidden)', async () => {
    await request(app.getHttpServer())
      .get('/api/staff/orders')
      .set('Authorization', `Bearer ${customerToken}`)
      .expect(403);
  });

  it('IT-08: POST /api/reviews thực thi KiemTraDaMua (403 nếu chưa mua COMPLETED, 201 nếu đã mua)', async () => {
    const prisma = app.get(PrismaService);
    if (createdOrderId) {
      await prisma.order.update({
        where: { id: createdOrderId },
        data: { status: 'COMPLETED' },
      });
      await prisma.review.deleteMany({
        where: { productId: testProductId },
      });
    }

    await request(app.getHttpServer())
      .post('/api/reviews')
      .set('Authorization', `Bearer ${customer2Token}`)
      .send({ productId: testProductId, stars: 5, content: 'Chưa mua thử' })
      .expect(403);

    const okRes = await request(app.getHttpServer())
      .post('/api/reviews')
      .set('Authorization', `Bearer ${customerToken}`)
      .send({ productId: testProductId, stars: 5, content: 'Cà phê rất thơm!' })
      .expect(201);

    const rev = okRes.body?.data || okRes.body;
    expect(rev.productId).toBe(testProductId);
    expect(rev.stars).toBe(5);
  });

  it('IT-09: GET /api/products, /api/products/toppings và /api/products/:id (200 / 404)', async () => {
    const listRes = await request(app.getHttpServer())
      .get('/api/products?category=COFFEE&page=1&limit=5')
      .expect(200);
    const listBody = listRes.body?.data || listRes.body;
    expect(Array.isArray(listBody.items)).toBe(true);
    expect(listBody.items.length).toBeGreaterThan(0);

    const toppingsRes = await request(app.getHttpServer())
      .get('/api/products/toppings')
      .expect(200);
    const toppingsBody = toppingsRes.body?.data || toppingsRes.body;
    expect(Array.isArray(toppingsBody)).toBe(true);
    expect(toppingsBody.length).toBeGreaterThan(0);

    const detailRes = await request(app.getHttpServer())
      .get(`/api/products/${testProductId}`)
      .expect(200);
    const detailBody = detailRes.body?.data || detailRes.body;
    expect(detailBody.id).toBe(testProductId);

    await request(app.getHttpServer())
      .get('/api/products/non-existent-id')
      .expect(404);
  });
});
