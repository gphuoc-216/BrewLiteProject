import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'nguyenvanan', description: 'Tên đăng nhập' })
  @IsString()
  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
  @MinLength(3, { message: 'Tên đăng nhập tối thiểu 3 ký tự' })
  username: string;

  @ApiProperty({ example: '123456', description: 'Mật khẩu' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  password: string;

  @ApiProperty({ example: 'Nguyễn Văn An', description: 'Họ và tên khách hàng' })
  @IsString()
  @IsNotEmpty({ message: 'Họ và tên không được để trống' })
  fullName: string;

  @ApiProperty({ example: 'an.nguyen@example.com', description: 'Địa chỉ Email' })
  @IsEmail({}, { message: 'Email không đúng định dạng' })
  email: string;
}
