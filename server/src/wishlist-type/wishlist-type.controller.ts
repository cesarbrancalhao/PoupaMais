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
import { WishlistTypeService } from './wishlist-type.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWishlistTypeDto } from './dto/create-wishlist-type.dto';
import { UpdateWishlistTypeDto } from './dto/update-wishlist-type.dto';

@ApiTags('wishlist-type')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wishlist-type')
export class WishlistTypeController {
  constructor(private service: WishlistTypeService) {}

  private getUserId(req: any): number {
    const userId =
      typeof req.user.userId === 'string' ? parseInt(req.user.userId, 10) : req.user.userId;
    if (isNaN(userId) || userId <= 0) {
      throw new BadRequestException('Invalid user ID');
    }
    return userId;
  }

  @Post()
  create(@Request() req, @Body() body: CreateWishlistTypeDto) {
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
  update(@Param('id') id: string, @Request() req, @Body() body: UpdateWishlistTypeDto) {
    return this.service.update(+id, this.getUserId(req), body.name, body.icon);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.service.remove(+id, this.getUserId(req));
  }
}
