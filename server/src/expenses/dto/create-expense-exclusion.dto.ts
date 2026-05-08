import { IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateExpenseExclusionDto {
  @ApiProperty({ example: '2025-11-01', description: 'Exclusion date (month that should not appear)' })
  @IsDateString()
  data_exclusao: string;
}
