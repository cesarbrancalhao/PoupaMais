import { IsOptional, IsString, IsInt, Min, Max, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class StatisticsQueryDto {
  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  start?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  end?: string;

  @ApiPropertyOptional({ description: 'Grouping interval', enum: ['month', 'week', 'day'] })
  @IsOptional()
  @IsString()
  interval?: 'month' | 'week' | 'day';

  @ApiPropertyOptional({ description: 'Grouping field', enum: ['category', 'source'] })
  @IsOptional()
  @IsString()
  groupBy?: 'category' | 'source';

  @ApiPropertyOptional({ description: 'Maximum results for top-N queries', default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;

  @ApiPropertyOptional({ description: 'Comparison period', enum: ['prev-month', 'prev-year'] })
  @IsOptional()
  @IsString()
  compareTo?: 'prev-month' | 'prev-year';

  @ApiPropertyOptional({ description: 'Filter by category IDs (comma-separated positive integers)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d+(,\d+)*$/, { message: 'categories must be a comma-separated list of positive integers' })
  categories?: string;

  @ApiPropertyOptional({ description: 'Filter by goal IDs (comma-separated positive integers)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d+(,\d+)*$/, { message: 'goals must be a comma-separated list of positive integers' })
  goals?: string;
}
