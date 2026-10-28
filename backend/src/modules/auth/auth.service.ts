import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { fallbackStore, MockAccount } from '../../prisma/fallback-store';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AccountStatus, Role } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    // 1. Try DB first
    try {
      const existingAccount = await this.prisma.account.findUnique({
        where: { username: dto.username },
      });
      if (existingAccount) {
        throw new ConflictException('Tên đăng nhập đã được sử dụng');
      }

      const existingEmail = await this.prisma.customer.findUnique({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new ConflictException('Địa chỉ Email đã được đăng ký tài khoản khác');
      }

      const passwordHash = await bcrypt.hash(dto.password, 10);

      const account = await this.prisma.account.create({
        data: {
          username: dto.username,
          passwordHash,
          role: Role.CUSTOMER,
          status: AccountStatus.ACTIVE,
          customer: {
            create: {
              fullName: dto.fullName,
              email: dto.email,
              loyaltyPoints: 0,
            },
          },
        },
        include: {
          customer: true,
        },
      });

      const tokens = await this.generateTokens(account.id, account.username, account.role);
      return {
        user: {
          accountId: account.id,
          username: account.username,
          role: account.role,
          profileId: account.customer?.id,
          fullName: account.customer?.fullName,
          email: account.customer?.email,
          loyaltyPoints: account.customer?.loyaltyPoints || 0,
        },
        ...tokens,
      };
    } catch (err: any) {
      if (err instanceof ConflictException) throw err;
      // Only fallback on database connection / runtime errors
    }

    // 2. Fallback in-memory store
    const existingAcc = fallbackStore.findAccountByUsername(dto.username);
    if (existingAcc) {
      throw new ConflictException('Tên đăng nhập đã được sử dụng');
    }

    const existingEmail = fallbackStore.findAccountByEmail(dto.email);
    if (existingEmail) {
      throw new ConflictException('Địa chỉ Email đã được đăng ký tài khoản khác');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const newAcc = fallbackStore.createAccount({
      username: dto.username,
      passwordHash,
      fullName: dto.fullName,
      email: dto.email,
    });

    const tokens = await this.generateTokens(newAcc.id, newAcc.username, newAcc.role);
    return {
      user: {
        accountId: newAcc.id,
        username: newAcc.username,
        role: newAcc.role,
        profileId: newAcc.customer?.id,
        fullName: newAcc.customer?.fullName,
        email: newAcc.customer?.email,
        loyaltyPoints: newAcc.customer?.loyaltyPoints || 0,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    let account = null;

    try {
      account = await this.prisma.account.findUnique({
        where: { username: dto.username },
        include: {
          customer: true,
          staff: true,
          admin: true,
        },
      });
    } catch (err: any) {
      if (err instanceof UnauthorizedException) throw err;
      // DB connection error
      account = null;
    }

    // Fallback store if not found in DB or DB offline
    if (!account) {
      account = fallbackStore.findAccountByUsername(dto.username) as any;
    }

    if (!account) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không chính xác');
    }

    if (account.status === AccountStatus.LOCKED) {
      throw new UnauthorizedException('Tài khoản đã bị khóa. Vui lòng liên hệ Quản trị viên');
    }

    const isMatch = await bcrypt.compare(dto.password, account.passwordHash);
    if (!isMatch) {
      throw new UnauthorizedException('Tên đăng nhập hoặc mật khẩu không chính xác');
    }

    let profile = null;
    if (account.role === Role.CUSTOMER) profile = account.customer;
    if (account.role === Role.STAFF) profile = account.staff;
    if (account.role === Role.ADMIN) profile = account.admin;

    const tokens = await this.generateTokens(account.id, account.username, account.role);

    return {
      user: {
        accountId: account.id,
        username: account.username,
        role: account.role,
        profileId: profile?.id,
        fullName: profile?.fullName,
        email: profile?.email,
        loyaltyPoints: account.customer?.loyaltyPoints || 0,
      },
      ...tokens,
    };
  }

  async refreshToken(refreshToken: string) {
    try {
      const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'brewlite_refresh_secret_key_2026';
      const payload = this.jwtService.verify(refreshToken, { secret: refreshSecret });

      let account = null;
      try {
        account = await this.prisma.account.findUnique({
          where: { id: payload.sub },
        });
      } catch {
        account = null;
      }

      if (!account) {
        account = fallbackStore.findAccountById(payload.sub) as any;
      }

      if (!account || account.status === AccountStatus.LOCKED) {
        throw new UnauthorizedException('Token không hợp lệ hoặc tài khoản đã bị khóa');
      }

      return this.generateTokens(account.id, account.username, account.role);
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }
  }

  async changePassword(accountId: string, dto: ChangePasswordDto) {
    let account = null;

    try {
      account = await this.prisma.account.findUnique({
        where: { id: accountId },
      });
    } catch {
      account = null;
    }

    if (!account) {
      account = fallbackStore.findAccountById(accountId) as any;
    }

    if (!account) {
      throw new BadRequestException('Tài khoản không tồn tại');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, account.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);

    try {
      await this.prisma.account.update({
        where: { id: accountId },
        data: { passwordHash: newPasswordHash },
      });
    } catch {
      fallbackStore.updatePassword(accountId, newPasswordHash);
    }

    return { message: 'Đổi mật khẩu thành công' };
  }

  private async generateTokens(accountId: string, username: string, role: string) {
    const payload = { sub: accountId, username, role };
    const jwtSecret = this.configService.get<string>('JWT_SECRET') || 'brewlite_super_secret_jwt_key_2026';
    const refreshSecret = this.configService.get<string>('JWT_REFRESH_SECRET') || 'brewlite_refresh_secret_key_2026';

    const accessToken = this.jwtService.sign(payload, {
      secret: jwtSecret,
      expiresIn: '7d',
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: refreshSecret,
      expiresIn: '30d',
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 604800, // 7 days in seconds
    };
  }
}
