import { IsEmail, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @ApiProperty({ example: 'ABC123', description: '6-character verification code' })
  @IsString()
  @MinLength(6, { message: 'Code must be at least 6 characters' })
  code: string;

  @ApiProperty({ example: 'newpassword123', description: 'New user password' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  newPassword: string;
}
