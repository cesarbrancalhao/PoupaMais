export interface GoalContribution {
  id: number
  goal_id: number
  value: number
  date: string
  observation?: string
  created_at: string
  user_id: number
  goal_name?: string
}

export interface CreateGoalContributionDto {
  goal_id: number
  value: number
  date?: string
  observation?: string
}

export interface UpdateGoalContributionDto {
  value?: number
  date?: string
  observation?: string
}
