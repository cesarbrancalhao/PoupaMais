export interface ExpenseCategory {
  id: number;
  name: string;
  icon: string;
  created_at: string;
  user_id: number;
}

export interface CreateExpenseCategoryDto {
  name: string;
  icon?: string;
}

export interface UpdateExpenseCategoryDto {
  name?: string;
  icon?: string;
}
