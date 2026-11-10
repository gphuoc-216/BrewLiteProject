import { ApiProperty } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class UserProfileDto {
  @ApiProperty({ example: '3c8e5414-2794-4364-9ee7-2852eb8e7ca4', description: 'Mã định danh tài khoản (UUID)' })
  accountId: string;

  @ApiProperty({ example: 'customer1', description: 'Tên đăng nhập' })
  username: string;

  @ApiProperty({ 
    enum: Role, 
    example: 'CUSTOMER', 
    description: 'Vai trò phân quyền trong hệ thống: CUSTOMER (Khách hàng) | STAFF (Barista quầy) | ADMIN (Quản trị viên)' 
  })
  role: Role;

  @ApiProperty({ example: 'f87a3290-7d71-42e1-8729-1a06e3009590', description: 'Mã hồ sơ Profile tương ứng' })
  profileId: string;

  @ApiProperty({ example: 'Nguyễn Văn A', description: 'Họ và tên người dùng' })
  fullName: string;

  @ApiProperty({ example: 'customer1@gmail.com', description: 'Địa chỉ Email' })
  email: string;

  @ApiProperty({ example: 120, description: 'Điểm thưởng tích lũy Loyalty (1 điểm = 100đ)' })
  loyaltyPoints: number;
}

export class AuthResponseDto {
  @ApiProperty({ type: UserProfileDto, description: 'Thông tin tài khoản và Role' })
  user: UserProfileDto;

  @ApiProperty({ 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', 
    description: 'JWT Access Token dùng để gắn vào Header: Authorization: Bearer <token>' 
  })
  accessToken: string;

  @ApiProperty({ 
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', 
    description: 'JWT Refresh Token để cấp mới khi Access Token hết hạn' 
  })
  refreshToken: string;

  @ApiProperty({ example: 604800, description: 'Thời hạn token tính bằng giây (7 ngày)' })
  expiresIn: number;
}

