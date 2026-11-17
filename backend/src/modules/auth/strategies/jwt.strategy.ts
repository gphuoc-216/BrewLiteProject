import { Injectable, UnauthorizedException, ForbiddenException, ServiceUnavailableException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { AccountStatus } from '@prisma/client';

/**
 * Chiến lược xác thực JWT (Trạm bảo vệ 1 trong JwtAuthGuard):
 * 1. Tách Bearer Token từ Header và kiểm tra chữ ký HMAC-SHA256 bằng JWT_SECRET + hạn sử dụng.
 * 2. Luôn truy vấn lại bảng Account trong PostgreSQL theo payload.sub (không tin role ghi trong token).
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // Đọc Authorization: Bearer <token>
      ignoreExpiration: false,                                  // Từ chối token đã hết hạn (401)
      secretOrKey: configService.get<string>('JWT_SECRET') || 'brewlite_super_secret_jwt_key_2026', // Khóa bí mật kiểm tra chữ ký
    });
  }

  async validate(payload: any) {
    let account = null;

    try {
      // Tra cứu lại tài khoản mới nhất từ DB để lấy role thật & status thật
      account = await this.prisma.account.findUnique({
        where: { id: payload.sub },
        include: {
          customer: true,
          staff: true,
          admin: true,
        },
      });
    } catch {
      throw new ServiceUnavailableException('Hệ thống cơ sở dữ liệu tạm thời gián đoạn, vui lòng thử lại sau');
    }

    if (!account) {
      throw new UnauthorizedException('Tài khoản không tồn tại trong hệ thống');
    }

    // Chặn ngay nếu tài khoản vừa bị Admin khóa dù token vẫn còn hạn
    if (account.status === AccountStatus.LOCKED) {
      throw new ForbiddenException('Tài khoản của bạn đã bị khóa bởi Quản trị viên');
    }

    let profile = null;
    if (account.role === 'CUSTOMER') profile = account.customer;
    if (account.role === 'STAFF') profile = account.staff;
    if (account.role === 'ADMIN') profile = account.admin;

    // Object trả về này sẽ được NestJS gắn vào request.user cho RolesGuard & Controller dùng
    return {
      accountId: account.id,
      username: account.username,
      role: account.role,
      status: account.status,
      profileId: profile?.id,
      customerId: account.customer?.id,
      fullName: profile?.fullName,
      email: profile?.email,
      loyaltyPoints: account.customer?.loyaltyPoints || 0,
    };
  }
}
