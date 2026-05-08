import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { GoalContributionService } from './goal-contribution.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateGoalContributionDto } from './dto/create-goal-contribution.dto';
import { UpdateGoalContributionDto } from './dto/update-goal-contribution.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@ApiTags('goal-contribution')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('goal-contribution')
export class GoalContributionController {
  constructor(private service: GoalContributionService) {}

  @Post()
  create(@Request() req, @Body() body: CreateGoalContributionDto) {
    return this.service.create(req.user.userId, body);
  }

  @Get()
  findAll(@Request() req, @Query() paginationQuery: PaginationQueryDto) {
    return this.service.findAll(req.user.userId, paginationQuery.page, paginationQuery.limit);
  }

  @Get('goal/:goalId')
  findAllByGoal(@Param('goalId') goalId: string, @Request() req, @Query() paginationQuery: PaginationQueryDto) {
    return this.service.findAllByGoal(+goalId, req.user.userId, paginationQuery.page, paginationQuery.limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.service.findOne(+id, req.user.userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Request() req, @Body() body: UpdateGoalContributionDto) {
    return this.service.update(+id, req.user.userId, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.service.remove(+id, req.user.userId);
  }
}
