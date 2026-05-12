import { IsEmail, IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SanitizeText } from '../../common/sanitization/sanitize';

export class UpdateProfileDto {
  @ApiProperty({ example: 'John Doe' })
  @SanitizeText()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
