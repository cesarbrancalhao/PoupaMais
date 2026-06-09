import { PartialType } from '@nestjs/swagger';
import { CreateWishlistTypeDto } from './create-wishlist-type.dto';

export class UpdateWishlistTypeDto extends PartialType(CreateWishlistTypeDto) {}
