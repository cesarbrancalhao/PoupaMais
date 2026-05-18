import { IsString, IsNumber, IsDateString, IsOptional, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SanitizeText } from '../../common/sanitization/sanitize';

export class CreateGoalDto {
  @ApiProperty({ example: 'Trip to Europe' })
  @SanitizeText()
  @IsString()
  name: string;

  @ApiProperty({ example: 'Planning a trip to Europe', required: false })
  @SanitizeText()
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 5000.0 })
  @IsNumber()
  @Min(0.01)
  value: number;

  @ApiProperty({ example: 500.0, required: false })
  @IsNumber()
  @IsOptional()
  @Min(0)
  monthly_savings?: number;

  @ApiProperty({ example: '2025-10-09', required: false })
  @IsDateString()
  @IsOptional()
  start_date?: string;

  @ApiProperty({ example: '2026-12-31', required: false })
  @IsDateString()
  @IsOptional()
  target_date?: string;
}
