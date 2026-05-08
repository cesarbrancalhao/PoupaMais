export interface IncomeSource {
  id: number;
  name: string;
  icon: string;
  created_at: string;
  user_id: number;
}

export interface CreateIncomeSourceDto {
  name: string;
  icon?: string;
}

export interface UpdateIncomeSourceDto {
  name?: string;
  icon?: string;
}
