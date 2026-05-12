import { IsString, IsNumber, IsBoolean, IsDateString, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SanitizeText } from '../../common/sanitization/sanitize';

export class CreateExpenseDto {
  @ApiProperty({ example: 'Supermarket' })
  @SanitizeText()
  @IsString()
  name: string;

  @ApiProperty({ example: 150.50 })
  @IsNumber()
  @Min(0.01)
  value: number;

  @ApiProperty({ example: false })
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
  expense_category_id?: number;
}
