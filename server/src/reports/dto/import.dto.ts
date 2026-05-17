import { IsArray, IsNotEmpty, ValidateNested, IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ImportRowDto {
  @ApiProperty({ description: 'Record type: expense_category, income_source, expense, income, goal, goal_contribution, expense_exclusion, income_exclusion' })
  @IsString()
  @IsNotEmpty()
  type: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  icon?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  value?: number;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  recurring?: boolean;

  @ApiProperty()
  @IsOptional()
  @IsString()
  date?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  due_date?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  category_name?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  source_name?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  current_value?: number;

  @ApiProperty()
  @IsOptional()
  @IsNumber()
  monthly_savings?: number;

  @ApiProperty()
  @IsOptional()
  @IsString()
  start_date?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  target_date?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  goal_name?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  observation?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  entity_name?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  entity_type?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  exclusion_date?: string;
}

export class ImportDto {
  @ApiProperty({ description: 'Array of records to import', type: [ImportRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportRowDto)
  rows: ImportRowDto[];
}
