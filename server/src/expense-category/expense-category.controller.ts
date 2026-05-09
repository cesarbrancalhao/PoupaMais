import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ExpenseCategoryService } from './expense-category.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto';

@ApiTags('expense-category')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('expense-category')
export class ExpenseCategoryController {
  constructor(private service: ExpenseCategoryService) {}

  @Post()
  create(@Request() req, @Body() body: CreateExpenseCategoryDto) {
    return this.service.create(req.user.userId, body.name, body.icon);
  }

  @Get()
  findAll(@Request() req) {
    return this.service.findAll(req.user.userId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req) {
    return this.service.findOne(+id, req.user.userId);
  }

  @Put(':id')
  update(@Param('id') id: string, @Request() req, @Body() body: UpdateExpenseCategoryDto) {
    return this.service.update(+id, req.user.userId, body.name, body.icon);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.service.remove(+id, req.user.userId);
  }
}
