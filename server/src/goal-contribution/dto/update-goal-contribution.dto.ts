import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateGoalContributionDto } from './create-goal-contribution.dto';

export class UpdateGoalContributionDto extends PartialType(
  OmitType(CreateGoalContributionDto, ['meta_id'] as const)
) {}
