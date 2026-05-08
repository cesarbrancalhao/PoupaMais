import { IsNumber, IsDateString, IsString, IsOptional, Min, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateGoalContributionDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  meta_id: number;

  @ApiProperty({ example: 250.00 })
  @IsNumber()
  @Min(0)
  valor: number;

  @ApiProperty({ example: '2025-11-13', required: false })
  @IsDateString()
  @IsOptional()
  data?: string;

  @ApiProperty({ example: 'Monthly contribution for November', required: false })
  @IsString()
  @IsOptional()
  observacao?: string;
}
