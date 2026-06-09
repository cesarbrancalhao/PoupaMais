import { PartialType } from '@nestjs/swagger';
import { CreateWishlistSagaDto } from './create-wishlist-saga.dto';

export class UpdateWishlistSagaDto extends PartialType(CreateWishlistSagaDto) {}
