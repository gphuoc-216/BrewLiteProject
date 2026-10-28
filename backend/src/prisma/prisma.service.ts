import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  public isConnected = false;

  async onModuleInit() {
    try {
      await this.$connect();
      this.isConnected = true;
      console.log('✅ [PrismaService] Đã kết nối cơ sở dữ liệu PostgreSQL thành công.');
    } catch (err: any) {
      this.isConnected = false;
      console.warn('⚠️ [PrismaService] Chưa thể kết nối PostgreSQL. Backend đang kích hoạt chế độ dữ liệu mẫu dự phòng.');
    }
  }

  async onModuleDestroy() {
    try {
      await this.$disconnect();
    } catch (err: any) {}
  }
}
