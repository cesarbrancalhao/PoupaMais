import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SanitizeText } from '../../common/sanitization/sanitize';

export class CreateIncomeSourceDto {
  @ApiProperty({ example: 'Salary' })
  @SanitizeText()
  @IsString()
  name: string;

  @ApiProperty({ example: 'DollarSign', required: false })
  @SanitizeText()
  @IsString()
  @IsOptional()
  icon?: string;
}
