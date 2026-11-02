import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ConflictException, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { AccountStatus, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

describe('AuthService (Unit Tests)', () => {
  let service: AuthService;
  let prisma: any;
  let jwtService: any;
  let configService: any;

  beforeEach(async () => {
    prisma = {
      account: {
        findUnique: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      customer: {
        findUnique: jest.fn(),
      },
    };

    jwtService = {
      sign: jest.fn().mockReturnValue('mock_jwt_token'),
      verify: jest.fn(),
    };

    configService = {
      get: jest.fn((key: string) => {
        if (key === 'JWT_SECRET') return 'test_secret';
        if (key === 'JWT_REFRESH_SECRET') return 'test_refresh_secret';
        return null;
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prisma },
        { provide: JwtService, useValue: jwtService },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  describe('register', () => {
    it('thành công tạo tài khoản mới và trả về tokens', async () => {
      prisma.account.findUnique.mockResolvedValue(null);
      prisma.customer.findUnique.mockResolvedValue(null);
      prisma.account.create.mockResolvedValue({
        id: 'acc-1',
        username: 'newuser',
        role: Role.CUSTOMER,
        status: AccountStatus.ACTIVE,
        customer: {
          fullName: 'Nguyễn Văn Mới',
          email: 'newuser@gmail.com',
          loyaltyPoints: 0,
        },
      });

      const res = await service.register({
        username: 'newuser',
        password: 'Password123!',
        fullName: 'Nguyễn Văn Mới',
        email: 'newuser@gmail.com',
      });

      expect(res.user.username).toBe('newuser');
      expect(res.user.role).toBe(Role.CUSTOMER);
      expect(res.accessToken).toBe('mock_jwt_token');
      expect(res.refreshToken).toBe('mock_jwt_token');
    });

    it('từ chối nếu username đã tồn tại (ConflictException)', async () => {
      prisma.account.findUnique.mockResolvedValue({ id: 'acc-existing' });

      await expect(
        service.register({
          username: 'existinguser',
          password: 'Password123!',
          fullName: 'Trùng Tên',
          email: 'unique@gmail.com',
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('từ chối nếu email đã được đăng ký bởi khách hàng khác', async () => {
      prisma.account.findUnique.mockResolvedValue(null);
      prisma.customer.findUnique.mockResolvedValue({ id: 'cust-existing' });

      await expect(
        service.register({
          username: 'newuser',
          password: 'Password123!',
          fullName: 'Trùng Email',
          email: 'existing@gmail.com',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('login', () => {
    it('thành công đăng nhập khi thông tin chính xác và tài khoản ACTIVE', async () => {
      const passwordHash = await bcrypt.hash('CorrectPass123', 10);
      prisma.account.findUnique.mockResolvedValue({
        id: 'acc-cust',
        username: 'customer1',
        passwordHash,
        role: Role.CUSTOMER,
        status: AccountStatus.ACTIVE,
        customer: { id: 'cust-1', fullName: 'Khách Hàng 1', email: 'c1@brewlite.vn', loyaltyPoints: 50 },
      });

      const res = await service.login({
        username: 'customer1',
        password: 'CorrectPass123',
      });

      expect(res.user.username).toBe('customer1');
      expect(res.user.loyaltyPoints).toBe(50);
      expect(res.accessToken).toBe('mock_jwt_token');
    });

    it('từ chối khi tài khoản bị khóa (status = LOCKED)', async () => {
      prisma.account.findUnique.mockResolvedValue({
        id: 'acc-locked',
        username: 'locked_user',
        passwordHash: 'somehash',
        role: Role.CUSTOMER,
        status: AccountStatus.LOCKED,
      });

      await expect(
        service.login({
          username: 'locked_user',
          password: 'AnyPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('từ chối khi sai mật khẩu', async () => {
      const passwordHash = await bcrypt.hash('CorrectPassword', 10);
      prisma.account.findUnique.mockResolvedValue({
        id: 'acc-cust',
        username: 'user1',
        passwordHash,
        role: Role.CUSTOMER,
        status: AccountStatus.ACTIVE,
      });

      await expect(
        service.login({
          username: 'user1',
          password: 'WrongPassword',
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('refreshToken', () => {
    it('cấp mới cặp token nếu refresh token hợp lệ và tài khoản ACTIVE', async () => {
      jwtService.verify.mockReturnValue({ sub: 'acc-valid' });
      prisma.account.findUnique.mockResolvedValue({
        id: 'acc-valid',
        username: 'validuser',
        role: Role.CUSTOMER,
        status: AccountStatus.ACTIVE,
      });

      const tokens = await service.refreshToken('valid_refresh_token');
      expect(tokens.accessToken).toBe('mock_jwt_token');
      expect(tokens.refreshToken).toBe('mock_jwt_token');
    });

    it('ném UnauthorizedException nếu refresh token không hợp lệ', async () => {
      jwtService.verify.mockImplementation(() => {
        throw new Error('Token expired');
      });

      await expect(service.refreshToken('expired_token')).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('changePassword', () => {
    it('thành công đổi mật khẩu khi nhập đúng mật khẩu cũ', async () => {
      const oldHash = await bcrypt.hash('OldSecret123', 10);
      prisma.account.findUnique.mockResolvedValue({
        id: 'acc-1',
        passwordHash: oldHash,
      });

      const res = await service.changePassword('acc-1', {
        oldPassword: 'OldSecret123',
        newPassword: 'NewSecret456!',
      });

      expect(res.message).toContain('thành công');
      expect(prisma.account.update).toHaveBeenCalled();
    });

    it('ném BadRequestException nếu nhập sai mật khẩu cũ', async () => {
      const oldHash = await bcrypt.hash('OldSecret123', 10);
      prisma.account.findUnique.mockResolvedValue({
        id: 'acc-1',
        passwordHash: oldHash,
      });

      await expect(
        service.changePassword('acc-1', {
          oldPassword: 'WrongOldPassword',
          newPassword: 'NewSecret456!',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});
