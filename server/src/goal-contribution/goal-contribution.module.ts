import { Module } from '@nestjs/common';
import { GoalContributionController } from './goal-contribution.controller';
import { GoalContributionService } from './goal-contribution.service';

@Module({
  controllers: [GoalContributionController],
  providers: [GoalContributionService],
})
export class GoalContributionModule {}
