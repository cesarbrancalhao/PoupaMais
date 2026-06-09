import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyPasswordResetDto {
  @ApiProperty({ example: 'user@example.com', description: 'User email' })
  @IsEmail({}, { message: 'Invalid email' })
  email: string;

  @ApiProperty({ example: 'ABC123', description: '6-character verification code' })
  @IsString()
  @Length(6, 6, { message: 'Code must be 6 characters' })
  code: string;
}
