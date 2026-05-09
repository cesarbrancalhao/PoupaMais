import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateGoalContributionDto } from './create-goal-contribution.dto';

export class UpdateGoalContributionDto extends PartialType(
  OmitType(CreateGoalContributionDto, ['goal_id'] as const)
) {}
