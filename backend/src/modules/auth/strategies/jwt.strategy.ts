import { Injectable, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../prisma/prisma.service';
import { fallbackStore } from '../../../prisma/fallback-store';
import { AccountStatus } from '@prisma/client';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'brewlite_super_secret_jwt_key_2026',
    });
  }

  async validate(payload: any) {
    let account = null;

    if (this.prisma.isConnected) {
      try {
        account = await this.prisma.account.findUnique({
          where: { id: payload.sub },
          include: {
            customer: true,
            staff: true,
            admin: true,
          },
        });
      } catch {
        account = null;
      }
    }

    if (!account) {
      account = fallbackStore.findAccountById(payload.sub) as any;
    }

    if (!account) {
      throw new UnauthorizedException('Tài khoản không tồn tại trong hệ thống');
    }

    if (account.status === AccountStatus.LOCKED) {
      throw new ForbiddenException('Tài khoản của bạn đã bị khóa bởi Quản trị viên');
    }

    let profile = null;
    if (account.role === 'CUSTOMER') profile = account.customer;
    if (account.role === 'STAFF') profile = account.staff;
    if (account.role === 'ADMIN') profile = account.admin;

    return {
      accountId: account.id,
      username: account.username,
      role: account.role,
      status: account.status,
      profileId: profile?.id,
      fullName: profile?.fullName,
      email: profile?.email,
      loyaltyPoints: account.customer?.loyaltyPoints || 0,
    };
  }
}
