import { IsString, IsNumber, IsBoolean, IsOptional, IsIn, Min, Matches } from 'class-validator';
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

  @ApiProperty({ example: '25Q1', required: false })
  @IsOptional()
  @IsString()
  @Matches(/^\d{2}Q[1-4]$/)
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
