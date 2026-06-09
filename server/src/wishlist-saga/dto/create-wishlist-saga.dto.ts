import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SanitizeText } from '../../common/sanitization/sanitize';

export class CreateWishlistSagaDto {
  @ApiProperty({ example: 'Youth' })
  @SanitizeText()
  @IsString()
  name: string;

  @ApiProperty({ example: 'BookOpen', required: false })
  @SanitizeText()
  @IsString()
  @IsOptional()
  icon?: string;
}
