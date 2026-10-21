import { Injectable, BadRequestException, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
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
  }

  async login(dto: LoginDto) {
    const account = await this.prisma.account.findUnique({
      where: { username: dto.username },
      include: {
        customer: true,
        staff: true,
        admin: true,
      },
    });

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

      const account = await this.prisma.account.findUnique({
        where: { id: payload.sub },
      });

      if (!account || account.status === AccountStatus.LOCKED) {
        throw new UnauthorizedException('Token không hợp lệ hoặc tài khoản đã bị khóa');
      }

      return this.generateTokens(account.id, account.username, account.role);
    } catch {
      throw new UnauthorizedException('Refresh token không hợp lệ hoặc đã hết hạn');
    }
  }

  async changePassword(accountId: string, dto: ChangePasswordDto) {
    const account = await this.prisma.account.findUnique({
      where: { id: accountId },
    });

    if (!account) {
      throw new BadRequestException('Tài khoản không tồn tại');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, account.passwordHash);
    if (!isMatch) {
      throw new BadRequestException('Mật khẩu hiện tại không chính xác');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, 10);
    await this.prisma.account.update({
      where: { id: accountId },
      data: { passwordHash: newPasswordHash },
    });

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
