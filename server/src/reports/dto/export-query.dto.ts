import { IsOptional, IsString, Matches } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class ExportQueryDto {
  @ApiPropertyOptional({ description: 'Start date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  start?: string;

  @ApiPropertyOptional({ description: 'End date (YYYY-MM-DD)' })
  @IsOptional()
  @IsString()
  end?: string;

  @ApiPropertyOptional({
    description: 'Filter by category IDs (comma-separated positive integers)',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d+(,\d+)*$/, {
    message: 'categories must be a comma-separated list of positive integers',
  })
  categories?: string;

  @ApiPropertyOptional({ description: 'Filter by source IDs (comma-separated positive integers)' })
  @IsOptional()
  @IsString()
  @Matches(/^\d+(,\d+)*$/, {
    message: 'sources must be a comma-separated list of positive integers',
  })
  sources?: string;
}
