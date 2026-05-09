import { IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateSettingsDto {
  @ApiProperty({ example: 'portuguese', enum: ['portuguese', 'english', 'spanish'] })
  @IsEnum(['portuguese', 'english', 'spanish'])
  language: string;

  @ApiProperty({ example: 'real', enum: ['real', 'dollar', 'euro'] })
  @IsEnum(['real', 'dollar', 'euro'])
  currency: string;
}
