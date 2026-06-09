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
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { IncomeSourceService } from './income-source.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateIncomeSourceDto } from './dto/create-income-source.dto';
import { UpdateIncomeSourceDto } from './dto/update-income-source.dto';

@ApiTags('income-source')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('income-source')
export class IncomeSourceController {
  constructor(private service: IncomeSourceService) {}

  @Post()
  create(@Request() req, @Body() body: CreateIncomeSourceDto) {
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
  update(@Param('id') id: string, @Request() req, @Body() body: UpdateIncomeSourceDto) {
    return this.service.update(+id, req.user.userId, body.name, body.icon);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req) {
    return this.service.remove(+id, req.user.userId);
  }
}
