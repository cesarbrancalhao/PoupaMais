import { Controller, Get, UseGuards, Request, Query } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { StatisticsQueryDto } from './dto/statistics-query.dto';

@ApiTags('statistics')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('statistics')
export class StatisticsController {
  constructor(private statisticsService: StatisticsService) {}

  @Get('kpi')
  getKpi(@Request() req, @Query() query: StatisticsQueryDto) {
    return this.statisticsService.getKpi(req.user.userId, query);
  }

  @Get('balance')
  getBalance(@Request() req, @Query() query: StatisticsQueryDto) {
    return this.statisticsService.getBalance(req.user.userId, query);
  }

  @Get('savings')
  getSavings(@Request() req, @Query() query: StatisticsQueryDto) {
    return this.statisticsService.getSavings(req.user.userId, query);
  }

  @Get('expenses-by-category')
  getExpensesByCategory(@Request() req, @Query() query: StatisticsQueryDto) {
    return this.statisticsService.getExpensesByCategory(req.user.userId, query);
  }

  @Get('expenses-over-time')
  getExpensesOverTime(@Request() req, @Query() query: StatisticsQueryDto) {
    return this.statisticsService.getExpensesOverTime(req.user.userId, query);
  }

  @Get('top-merchants')
  getTopMerchants(@Request() req, @Query() query: StatisticsQueryDto) {
    return this.statisticsService.getTopMerchants(req.user.userId, query);
  }

  @Get('heatmap')
  getHeatmap(@Request() req, @Query() query: StatisticsQueryDto) {
    return this.statisticsService.getHeatmap(req.user.userId, query);
  }

  @Get('goals')
  getGoals(@Request() req) {
    return this.statisticsService.getGoals(req.user.userId);
  }

  @Get('comparative')
  getComparative(@Request() req, @Query() query: StatisticsQueryDto) {
    return this.statisticsService.getComparative(req.user.userId, query);
  }

  @Get('anomalies')
  getAnomalies(@Request() req, @Query() query: StatisticsQueryDto) {
    return this.statisticsService.getAnomalies(req.user.userId, query);
  }
}
