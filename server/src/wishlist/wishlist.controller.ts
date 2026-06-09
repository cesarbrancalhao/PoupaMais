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
  Query,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@ApiTags('wishlist')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wishlist')
export class WishlistController {
  constructor(private service: WishlistService) {}

  private getUserId(req: any): number {
    const userId =
      typeof req.user.userId === 'string' ? parseInt(req.user.userId, 10) : req.user.userId;
    if (isNaN(userId) || userId <= 0) {
      throw new BadRequestException('Invalid user ID');
    }
    return userId;
  }

  @Post()
  create(@Request() req, @Body() body: CreateWishlistDto) {
    return this.service.create(this.getUserId(req), body);
  }

  @Get()
  findAll(@Request() req, @Query() paginationQuery: PaginationQueryDto) {
    return this.service.findAll(this.getUserId(req), paginationQuery.page, paginationQuery.limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.service.findOne(+id, this.getUserId(req));
  }

  @Put(':id')
  update(@Param('id') id: string, @Request() req, @Body() body: UpdateWishlistDto) {
    return this.service.update(+id, this.getUserId(req), body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.service.remove(+id, this.getUserId(req));
  }
}
