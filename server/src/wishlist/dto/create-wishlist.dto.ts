import { IsString, IsNumber, IsBoolean, IsOptional, IsIn, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { SanitizeText } from '../../common/sanitization/sanitize';

export class CreateWishlistDto {
  @ApiProperty({ example: 'New Laptop' })
  @SanitizeText()
  @IsString()
  name: string;

  @ApiProperty({ example: 1500.0 })
  @IsNumber()
  @Min(0.01)
  price: number;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  checked?: boolean;

  @ApiProperty({ example: 'medium', required: false, enum: ['low', 'medium', 'high'] })
  @IsOptional()
  @IsString()
  @IsIn(['low', 'medium', 'high'])
  priority?: string;

  @ApiProperty({ example: 'Q1', required: false, enum: ['Q1', 'Q2', 'Q3', 'Q4'] })
  @IsOptional()
  @IsString()
  @IsIn(['Q1', 'Q2', 'Q3', 'Q4'])
  quarter?: string;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  wishlist_type_id?: number;

  @ApiProperty({ example: 1, required: false })
  @IsOptional()
  @IsNumber()
  saga_id?: number;
}
