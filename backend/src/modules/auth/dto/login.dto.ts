import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'customer1', description: 'Tên đăng nhập' })
  @IsString({ message: 'Tên đăng nhập phải là chuỗi ký tự' })
  @IsNotEmpty({ message: 'Tên đăng nhập không được để trống' })
  username: string;

  @ApiProperty({ example: '123456', description: 'Mật khẩu' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu tối thiểu 6 ký tự' })
  password: string;
}
