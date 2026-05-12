import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, Matches, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import {
  PASSWORD_COMPLEXITY_MESSAGE,
  PASSWORD_COMPLEXITY_REGEX,
  PASSWORD_MIN_LENGTH,
} from '../../common/validators/password.validator';
import { SanitizeText } from '../../common/sanitization/sanitize';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @SanitizeText()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'Passw0rd!', minLength: PASSWORD_MIN_LENGTH })
  @IsString()
  @MinLength(PASSWORD_MIN_LENGTH, { message: `Password must be at least ${PASSWORD_MIN_LENGTH} characters` })
  @Matches(PASSWORD_COMPLEXITY_REGEX, { message: PASSWORD_COMPLEXITY_MESSAGE })
  password: string;

  @ApiProperty({
    example: 'english',
    required: false,
    enum: ['portuguese', 'english', 'spanish'],
    description: 'Language selected for initial user data',
  })
  @IsOptional()
  @IsIn(['portuguese', 'english', 'spanish'])
  language?: 'portuguese' | 'english' | 'spanish';
}
