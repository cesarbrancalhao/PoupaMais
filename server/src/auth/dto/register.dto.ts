import { IsEmail, IsIn, IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({ example: 'password123', minLength: 8 })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
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
