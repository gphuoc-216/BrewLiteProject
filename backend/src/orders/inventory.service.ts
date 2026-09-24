import { Injectable, ConflictException, BadRequestException } from '@nestjs/common';

export interface ProductItem {
  id: string;
  name: string;
  stock: number;
  version: number;
}

export interface UserAccount {
  id: string;
  loyaltyPoints: number;
}

@Injectable()
export class InventoryService {
  private products = new Map<string, ProductItem>();
  private users = new Map<string, UserAccount>();

  setProduct(product: ProductItem): void {
    this.products.set(product.id, { ...product });
  }

  getProduct(id: string): ProductItem | undefined {
    return this.products.get(id);
  }

  setUser(user: UserAccount): void {
    this.users.set(user.id, { ...user });
  }

  getUser(id: string): UserAccount | undefined {
    return this.users.get(id);
  }

  deductStock(productId: string, quantity: number, expectedVersion: number): ProductItem {
    const product = this.products.get(productId);
    if (!product) {
      throw new BadRequestException('S?n ph?m không t?n t?i');
    }

    if (product.version !== expectedVersion) {
      throw new ConflictException(
        'Xung ð?t d? li?u (Optimistic Lock): D? li?u s?n ph?m ð? b? thay ð?i b?i giao d?ch khác'
      );
    }

    if (product.stock < quantity) {
      throw new BadRequestException('S? lý?ng t?n kho không ð?');
    }

    const updatedProduct: ProductItem = {
      ...product,
      stock: product.stock - quantity,
      version: product.version + 1,
    };

    this.products.set(productId, updatedProduct);
    return updatedProduct;
  }

  awardLoyaltyPoints(userId: string, orderTotal: number): UserAccount {
    const user = this.users.get(userId) || { id: userId, loyaltyPoints: 0 };
    const earnedPoints = Math.floor(orderTotal / 10000);

    const updatedUser: UserAccount = {
      ...user,
      loyaltyPoints: user.loyaltyPoints + earnedPoints,
    };

    this.users.set(userId, updatedUser);
    return updatedUser;
  }
}
