import { Module } from '@nestjs/common';
import { WishlistSagaController } from './wishlist-saga.controller';
import { WishlistSagaService } from './wishlist-saga.service';

@Module({
  controllers: [WishlistSagaController],
  providers: [WishlistSagaService],
})
export class WishlistSagaModule {}
