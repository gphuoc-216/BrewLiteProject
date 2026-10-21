import { Test, TestingModule } from '@nestjs/testing';
import { StaffService } from './staff.service';
import { PrismaService } from '../../prisma/prisma.service';
import { OrderStatus } from '@prisma/client';
import { ConflictException, NotFoundException } from '@nestjs/common';

describe('StaffService (Unit Tests)', () => {
  let service: StaffService;
  let prisma: any;

  beforeEach(async () => {
    prisma = {
      order: {
        findMany: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      orderStatusHistory: {
        create: jest.fn(),
      },
      $transaction: jest.fn(async (cb) => cb(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        StaffService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<StaffService>(StaffService);
  });

  describe('getOrdersForBarista', () => {
    it('lấy danh sách đơn theo thứ tự FIFO', async () => {
      prisma.order.findMany.mockResolvedValue([
        { id: 'order-1', status: OrderStatus.PAID },
        { id: 'order-2', status: OrderStatus.PREPARING },
      ]);

      const result = await service.getOrdersForBarista();
      expect(result.length).toBe(2);
      expect(prisma.order.findMany).toHaveBeenCalled();
    });
  });

  describe('acceptOrder', () => {
    it('chuyển trạng thái từ PAID sang PREPARING thành công', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.PAID,
      });
      prisma.order.update.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.PREPARING,
        staffId: 'staff-1',
      });

      const updated = await service.acceptOrder('order-1', 'staff-1');
      expect(updated.status).toBe(OrderStatus.PREPARING);
      expect(prisma.orderStatusHistory.create).toHaveBeenCalled();
    });

    it('từ chối nhận đơn nếu đơn chưa thanh toán (PENDING -> PREPARING)', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.PENDING,
      });

      await expect(service.acceptOrder('order-1', 'staff-1')).rejects.toThrow(ConflictException);
    });

    it('ném NotFoundException nếu không tìm thấy đơn hàng', async () => {
      prisma.order.findUnique.mockResolvedValue(null);

      await expect(service.acceptOrder('non-exist', 'staff-1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('markReady', () => {
    it('chuyển trạng thái từ PREPARING sang READY thành công', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.PREPARING,
      });
      prisma.order.update.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.READY,
      });

      const updated = await service.markReady('order-1', 'staff-1');
      expect(updated.status).toBe(OrderStatus.READY);
    });
  });

  describe('completeOrder', () => {
    it('chuyển trạng thái từ READY sang COMPLETED thành công', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.READY,
      });
      prisma.order.update.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.COMPLETED,
      });

      const updated = await service.completeOrder('order-1', 'staff-1');
      expect(updated.status).toBe(OrderStatus.COMPLETED);
    });

    it('từ chối chuyển COMPLETED trực tiếp từ PAID', async () => {
      prisma.order.findUnique.mockResolvedValue({
        id: 'order-1',
        status: OrderStatus.PAID,
      });

      await expect(service.completeOrder('order-1', 'staff-1')).rejects.toThrow(ConflictException);
    });
  });
});
