import {
  Controller,
  Get,
  Post,
  UseGuards,
  Request,
  Query,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { ExportQueryDto } from './dto/export-query.dto';
import { ImportDto } from './dto/import.dto';

@ApiTags('reports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('export')
  exportData(@Request() req, @Query() query: ExportQueryDto) {
    return this.reportsService.exportData(req.user.userId, query);
  }

  @Post('import')
  @HttpCode(HttpStatus.OK)
  importData(@Request() req, @Body() dto: ImportDto) {
    return this.reportsService.importData(req.user.userId, dto);
  }
}
