import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SanitizeText } from '../../common/sanitization/sanitize';

export class CreateWishlistTypeDto {
  @ApiProperty({ example: 'Electronics' })
  @SanitizeText()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Smartphone', required: false })
  @SanitizeText()
  @IsString()
  @IsOptional()
  icon?: string;
}
