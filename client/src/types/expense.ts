export interface Expense {
  id: number;
  name: string;
  value: number;
  recurring: boolean;
  date: string;
  due_date?: string;
  created_at: string;
  expense_category_id?: number;
  user_id: number;
}

export interface CreateExpenseDto {
  name: string;
  value: number;
  recurring: boolean;
  date: string;
  due_date?: string;
  expense_category_id?: number;
}

export interface UpdateExpenseDto {
  name?: string;
  value?: number;
  recurring?: boolean;
  date?: string;
  due_date?: string;
  expense_category_id?: number;
}
