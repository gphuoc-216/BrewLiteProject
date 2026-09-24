import { InventoryService } from './inventory.service';
import { ConflictException, BadRequestException } from '@nestjs/common';

describe('Inventory & Loyalty Service Tests (Task 10.3 & 10.4)', () => {
  let service: InventoryService;

  beforeEach(() => {
    service = new InventoryService();
    service.setProduct({
      id: 'prod_coffee_1',
      name: 'Cà phê mu?i',
      stock: 1,
      version: 1,
    });

    service.setUser({
      id: 'user_001',
      loyaltyPoints: 10,
    });
  });

  describe('Optimistic Locking (Task 10.3)', () => {
    it('tr? t?n kho thành công khi truy?n ðúng version', () => {
      const updated = service.deductStock('prod_coffee_1', 1, 1);
      expect(updated.stock).toBe(0);
      expect(updated.version).toBe(2);
    });

    it('ch?n giao d?ch th? hai (ném ConflictException 409) khi 2 request cùng tranh ch?p 1 món hàng cu?i', () => {
      service.deductStock('prod_coffee_1', 1, 1);

      expect(() => {
        service.deductStock('prod_coffee_1', 1, 1);
      }).toThrow(ConflictException);
    });

    it('t? ch?i khi s? lý?ng mua vý?t quá s? lý?ng t?n kho', () => {
      expect(() => {
        service.deductStock('prod_coffee_1', 5, 1);
      }).toThrow(BadRequestException);
    });
  });

  describe('Loyalty Points Accumulation (Task 10.4)', () => {
    it('c?ng ði?m thý?ng chính xác d?a trên giá tr? ðõn hàng (10.000 VNÐ = 1 ði?m)', () => {
      const result = service.awardLoyaltyPoints('user_001', 45000);
      expect(result.loyaltyPoints).toBe(14);
    });
  });
});
