import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IncomesService } from './incomes.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateIncomeDto } from './dto/create-income.dto';
import { UpdateIncomeDto } from './dto/update-income.dto';
import { CreateIncomeExclusionDto } from './dto/create-income-exclusion.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@ApiTags('incomes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('incomes')
export class IncomesController {
  constructor(private service: IncomesService) {}

  @Post()
  create(@Request() req, @Body() body: CreateIncomeDto) {
    return this.service.create(req.user.userId, body);
  }

  @Get()
  findAll(@Request() req, @Query() paginationQuery: PaginationQueryDto) {
    return this.service.findAll(req.user.userId, paginationQuery.page, paginationQuery.limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.service.findOne(+id, req.user.userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Request() req, @Body() body: UpdateIncomeDto) {
    return this.service.update(+id, req.user.userId, body);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.service.remove(+id, req.user.userId);
  }

  @Post(':id/exclusions')
  createExclusion(@Param('id') id: string, @Request() req, @Body() createExclusionDto: CreateIncomeExclusionDto) {
    return this.service.createExclusion(+id, req.user.userId, createExclusionDto);
  }

  @Get('exclusions/all')
  findAllExclusions(@Request() req) {
    return this.service.findAllExclusions(req.user.userId);
  }

  @Delete('exclusions/:id')
  removeExclusion(@Param('id') id: string, @Request() req) {
    return this.service.removeExclusion(+id, req.user.userId);
  }
}
