import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateIncomeSourceDto {
  @ApiProperty({ example: 'Salário' })
  @IsString()
  nome: string;

  @ApiProperty({ example: 'DollarSign', required: false })
  @IsString()
  @IsOptional()
  icone?: string;
}
