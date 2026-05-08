import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ExpensesService } from './expenses.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { CreateExpenseExclusionDto } from './dto/create-expense-exclusion.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@ApiTags('expenses')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private expensesService: ExpensesService) {}

  @Post()
  create(@Request() req, @Body() createExpenseDto: CreateExpenseDto) {
    return this.expensesService.create(req.user.userId, createExpenseDto);
  }

  @Get()
  findAll(@Request() req, @Query() paginationQuery: PaginationQueryDto) {
    return this.expensesService.findAll(req.user.userId, paginationQuery.page, paginationQuery.limit);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.expensesService.findOne(+id, req.user.userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Request() req, @Body() updateExpenseDto: UpdateExpenseDto) {
    return this.expensesService.update(+id, req.user.userId, updateExpenseDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.expensesService.remove(+id, req.user.userId);
  }

  @Post(':id/exclusions')
  createExclusion(@Param('id') id: string, @Request() req, @Body() createExclusionDto: CreateExpenseExclusionDto) {
    return this.expensesService.createExclusion(+id, req.user.userId, createExclusionDto);
  }

  @Get('exclusions/all')
  findAllExclusions(@Request() req) {
    return this.expensesService.findAllExclusions(req.user.userId);
  }

  @Delete('exclusions/:id')
  removeExclusion(@Param('id') id: string, @Request() req) {
    return this.expensesService.removeExclusion(+id, req.user.userId);
  }
}
