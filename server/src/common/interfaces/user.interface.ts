export interface User {
  id: number;
  name: string;
  email: string;
  password: string;
  language: 'portuguese' | 'english' | 'spanish';
  currency: 'real' | 'dollar' | 'euro';
  created_at: Date;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  icon: string;
  created_at: Date;
  user_id: number;
}

export interface IncomeSource {
  id: number;
  name: string;
  icon: string;
  created_at: Date;
  user_id: number;
}

export interface Expense {
  id: number;
  name: string;
  value: number;
  recurring: boolean;
  date: Date;
  due_date: Date | null;
  created_at: Date;
  expense_category_id: number | null;
  user_id: number;
}

export interface Income {
  id: number;
  name: string;
  value: number;
  recurring: boolean;
  date: Date;
  due_date: Date | null;
  created_at: Date;
  income_source_id: number | null;
  user_id: number;
}

export interface Goal {
  id: number;
  name: string;
  value: number;
  monthly_savings: number;
  start_date: Date;
  created_at: Date;
  user_id: number;
}
