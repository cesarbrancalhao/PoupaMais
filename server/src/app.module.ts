import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { DatabaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ExpenseCategoryModule } from './expense-category/expense-category.module';
import { IncomeSourceModule } from './income-source/income-source.module';
import { ExpensesModule } from './expenses/expenses.module';
import { IncomesModule } from './incomes/incomes.module';
import { GoalsModule } from './goals/goals.module';
import { GoalContributionModule } from './goal-contribution/goal-contribution.module';
import { StatisticsModule } from './statistics/statistics.module';
import { ReportsModule } from './reports/reports.module';
import { AuditModule } from './common/audit/audit.module';
import { CsrfGuard } from './auth/guards/csrf.guard';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    AuditModule,
    DatabaseModule,
    AuthModule,
    UsersModule,
    ExpenseCategoryModule,
    IncomeSourceModule,
    ExpensesModule,
    IncomesModule,
    GoalsModule,
    GoalContributionModule,
    StatisticsModule,
    ReportsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: CsrfGuard,
    },
  ],
})
export class AppModule {}
