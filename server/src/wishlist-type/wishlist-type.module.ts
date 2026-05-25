import { Module } from '@nestjs/common';
import { WishlistTypeController } from './wishlist-type.controller';
import { WishlistTypeService } from './wishlist-type.service';

@Module({
  controllers: [WishlistTypeController],
  providers: [WishlistTypeService],
})
export class WishlistTypeModule {}
