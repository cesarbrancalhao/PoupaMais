import { IsNumber, IsDateString, IsString, IsOptional, Min, IsInt } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SanitizeText } from '../../common/sanitization/sanitize';

export class CreateGoalContributionDto {
  @ApiProperty({ example: 1 })
  @IsInt()
  goal_id: number;

  @ApiProperty({ example: 250.0 })
  @IsNumber()
  @Min(0)
  value: number;

  @ApiProperty({ example: '2025-11-13', required: false })
  @IsDateString()
  @IsOptional()
  date?: string;

  @ApiProperty({ example: 'Monthly contribution for November', required: false })
  @SanitizeText()
  @IsString()
  @IsOptional()
  observation?: string;
}
