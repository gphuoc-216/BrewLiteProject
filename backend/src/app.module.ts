import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { PromotionsModule } from './modules/promotions/promotions.module';
import { OrdersModule } from './modules/orders/orders.module';
import { PaymentModule } from './modules/payment/payment.module';
import { StaffModule } from './modules/staff/staff.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    ProductsModule,
    PromotionsModule,
    OrdersModule,
    PaymentModule,
    StaffModule,
    ReviewsModule,
    AdminModule,
  ],
})
export class AppModule { }
