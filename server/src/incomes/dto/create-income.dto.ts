import { IsString, IsNumber, IsBoolean, IsDateString, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateIncomeDto {
  @ApiProperty({ example: 'Salário' })
  @IsString()
  nome: string;

  @ApiProperty({ example: 2500.00 })
  @IsNumber()
  @Min(0.01)
  valor: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  recorrente: boolean;

  @ApiProperty({ example: '2025-10-09' })
  @IsDateString()
  data: string;

  @ApiProperty({ example: '2025-10-15', required: false })
  @IsDateString()
  @IsOptional()
  data_vencimento?: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  fonte_receita_id?: number;
}
