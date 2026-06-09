import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SanitizeText } from '../../common/sanitization/sanitize';

export class CreateExpenseCategoryDto {
  @ApiProperty({ example: 'Food' })
  @SanitizeText()
  @IsString()
  name: string;

  @ApiProperty({ example: 'ShoppingCart', required: false })
  @SanitizeText()
  @IsString()
  @IsOptional()
  icon?: string;
}
