import {
  IsArray,
  IsIn,
  IsNotEmpty,
  ValidateNested,
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { SanitizeText } from '../../common/sanitization/sanitize';

export const IMPORT_ROW_TYPES = [
  'expense_category',
  'income_source',
  'expense',
  'income',
  'goal',
  'goal_contribution',
  'expense_exclusion',
  'income_exclusion',
  'wishlist_type',
  'wishlist_saga',
  'wishlist',
] as const;

export class ImportRowDto {
  @ApiProperty({
    description:
      'Record type: expense_category, income_source, expense, income, goal, goal_contribution, expense_exclusion, income_exclusion, wishlist_type, wishlist_saga, wishlist',
    enum: IMPORT_ROW_TYPES,
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(IMPORT_ROW_TYPES)
  type: string;

  @ApiProperty()
  @IsOptional()
  @SanitizeText()
  @IsString()
  name?: string;

  @ApiProperty()
  @IsOptional()
  @SanitizeText()
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
  @SanitizeText()
  @IsString()
  category_name?: string;

  @ApiProperty()
  @IsOptional()
  @SanitizeText()
  @IsString()
  source_name?: string;

  @ApiProperty()
  @IsOptional()
  @SanitizeText()
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
  @SanitizeText()
  @IsString()
  goal_name?: string;

  @ApiProperty()
  @IsOptional()
  @SanitizeText()
  @IsString()
  observation?: string;

  @ApiProperty()
  @IsOptional()
  @SanitizeText()
  @IsString()
  entity_name?: string;

  @ApiProperty()
  @IsOptional()
  @SanitizeText()
  @IsString()
  entity_type?: string;

  @ApiProperty()
  @IsOptional()
  @IsString()
  exclusion_date?: string;

  @ApiProperty()
  @IsOptional()
  @IsBoolean()
  checked?: boolean;

  @ApiProperty({ enum: ['low', 'medium', 'high'] })
  @IsOptional()
  @IsString()
  @IsIn(['low', 'medium', 'high'])
  priority?: string;

  @ApiProperty({ example: '25Q1' })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}Q[1-4]$/)
  quarter?: string;

  @ApiProperty()
  @IsOptional()
  @SanitizeText()
  @IsString()
  type_name?: string;

  @ApiProperty()
  @IsOptional()
  @SanitizeText()
  @IsString()
  saga_name?: string;
}

export class ImportDto {
  @ApiProperty({ description: 'Array of records to import', type: [ImportRowDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportRowDto)
  rows: ImportRowDto[];
}
