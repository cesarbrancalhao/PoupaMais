export interface Goal {
  id: number
  name: string
  description?: string
  value: number
  current_value: number
  monthly_savings: number
  start_date: string
  target_date?: string
  created_at: string
  user_id: number
}

export interface CreateGoalDto {
  name: string
  description?: string
  value: number
  monthly_savings?: number
  start_date?: string
  target_date?: string
}

export interface UpdateGoalDto {
  name?: string
  description?: string
  value?: number
  monthly_savings?: number
  start_date?: string
  target_date?: string
}
