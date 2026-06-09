export interface Income {
  id: number;
  name: string;
  value: number;
  recurring: boolean;
  date: string;
  due_date?: string;
  created_at: string;
  income_source_id?: number;
  user_id: number;
}

export interface CreateIncomeDto {
  name: string;
  value: number;
  recurring: boolean;
  date: string;
  due_date?: string;
  income_source_id?: number;
}

export interface UpdateIncomeDto {
  name?: string;
  value?: number;
  recurring?: boolean;
  date?: string;
  due_date?: string;
  income_source_id?: number;
}
