import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExpenseCategoryDto {
  @ApiProperty({ example: 'Food' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'ShoppingCart', required: false })
  @IsString()
  @IsOptional()
  icon?: string;
}
