import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: '123456', description: 'Mật khẩu hiện tại' })
  @IsString()
  @IsNotEmpty({ message: 'Mật khẩu cũ không được để trống' })
  oldPassword: string;

  @ApiProperty({ example: 'newpass123', description: 'Mật khẩu mới' })
  @IsString()
  @MinLength(6, { message: 'Mật khẩu mới tối thiểu 6 ký tự' })
  newPassword: string;
}
