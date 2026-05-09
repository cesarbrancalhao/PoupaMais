import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ChangePasswordDto {
  @ApiProperty({ example: '12345678', description: 'Current user password' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  currentPassword: string;

  @ApiProperty({ example: '87654321', description: 'New user password' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  newPassword: string;
}
