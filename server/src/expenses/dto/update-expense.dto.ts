import { IsString, IsNumber, IsBoolean, IsDateString, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateExpenseDto {
  @ApiProperty({ example: 'Supermercado', required: false })
  @IsString()
  @IsOptional()
  nome?: string;

  @ApiProperty({ example: 150.50, required: false })
  @IsNumber()
  @Min(0.01)
  @IsOptional()
  valor?: number;

  @ApiProperty({ example: false, required: false })
  @IsBoolean()
  @IsOptional()
  recorrente?: boolean;

  @ApiProperty({ example: '2025-10-09', required: false })
  @IsDateString()
  @IsOptional()
  data?: string;

  @ApiProperty({ example: '2025-10-15', required: false })
  @IsDateString()
  @IsOptional()
  data_vencimento?: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  categoria_despesa_id?: number;
}
