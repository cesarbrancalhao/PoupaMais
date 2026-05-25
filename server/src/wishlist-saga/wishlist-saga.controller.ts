import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WishlistSagaService } from './wishlist-saga.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWishlistSagaDto } from './dto/create-wishlist-saga.dto';
import { UpdateWishlistSagaDto } from './dto/update-wishlist-saga.dto';

@ApiTags('wishlist-saga')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wishlist-saga')
export class WishlistSagaController {
  constructor(private service: WishlistSagaService) {}

  private getUserId(req: any): number {
    const userId =
      typeof req.user.userId === 'string' ? parseInt(req.user.userId, 10) : req.user.userId;
    if (isNaN(userId) || userId <= 0) {
      throw new BadRequestException('Invalid user ID');
    }
    return userId;
  }

  @Post()
  create(@Request() req, @Body() body: CreateWishlistSagaDto) {
    return this.service.create(this.getUserId(req), body.name, body.icon);
  }

  @Get()
  findAll(@Request() req) {
    return this.service.findAll(this.getUserId(req));
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.service.findOne(+id, this.getUserId(req));
  }

  @Put(':id')
  update(@Param('id') id: string, @Request() req, @Body() body: UpdateWishlistSagaDto) {
    return this.service.update(+id, this.getUserId(req), body.name, body.icon);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.service.remove(+id, this.getUserId(req));
  }
}
