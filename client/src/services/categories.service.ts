import { apiService } from './api';
import { ExpenseCategory, CreateExpenseCategoryDto, UpdateExpenseCategoryDto } from '@/types';

export const expenseCategoryService = {
  async getAll(): Promise<ExpenseCategory[]> {
    return apiService.get('/expense-category');
  },

  async getById(id: number): Promise<ExpenseCategory> {
    return apiService.get(`/expense-category/${id}`);
  },

  async create(data: CreateExpenseCategoryDto): Promise<ExpenseCategory> {
    return apiService.post('/expense-category', data);
  },

  async update(id: number, data: UpdateExpenseCategoryDto): Promise<ExpenseCategory> {
    return apiService.put(`/expense-category/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return apiService.delete(`/expense-category/${id}`);
  },
};
