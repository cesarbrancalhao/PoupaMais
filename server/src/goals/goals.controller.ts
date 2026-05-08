import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GoalsService } from './goals.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateGoalDto } from './dto/create-goal.dto';
import { UpdateGoalDto } from './dto/update-goal.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@ApiTags('goals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('goals')
export class GoalsController {
  constructor(private service: GoalsService) {}

  private getUserId(req: any): number {
    const userId = typeof req.user.userId === 'string' ? parseInt(req.user.userId, 10) : req.user.userId;
    if (isNaN(userId) || userId <= 0) {
      throw new BadRequestException('Invalid user ID');
    }
    return userId;
  }

  @Post()
  create(@Request() req, @Body() body: CreateGoalDto) {
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
  update(@Param('id') id: string, @Request() req, @Body() body: UpdateGoalDto) {
    return this.service.update(+id, this.getUserId(req), body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.service.remove(+id, this.getUserId(req));
  }
}
