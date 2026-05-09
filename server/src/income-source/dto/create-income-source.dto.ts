import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateIncomeSourceDto {
  @ApiProperty({ example: 'Salary' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'DollarSign', required: false })
  @IsString()
  @IsOptional()
  icon?: string;
}
