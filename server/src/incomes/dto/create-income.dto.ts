import { IsString, IsNumber, IsBoolean, IsDateString, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateIncomeDto {
  @ApiProperty({ example: 'Salary' })
  @IsString()
  name: string;

  @ApiProperty({ example: 2500.00 })
  @IsNumber()
  @Min(0.01)
  value: number;

  @ApiProperty({ example: true })
  @IsBoolean()
  recurring: boolean;

  @ApiProperty({ example: '2025-10-09' })
  @IsDateString()
  date: string;

  @ApiProperty({ example: '2025-10-15', required: false })
  @IsDateString()
  @IsOptional()
  due_date?: string;

  @ApiProperty({ example: 1, required: false })
  @IsNumber()
  @IsOptional()
  income_source_id?: number;
}
