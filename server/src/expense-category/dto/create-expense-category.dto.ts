import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExpenseCategoryDto {
  @ApiProperty({ example: 'Alimentação' })
  @IsString()
  nome: string;

  @ApiProperty({ example: 'ShoppingCart', required: false })
  @IsString()
  @IsOptional()
  icone?: string;
}
