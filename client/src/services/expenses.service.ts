import { apiService } from './api';
import { Expense, CreateExpenseDto, UpdateExpenseDto } from '@/types';

export const expensesService = {
  async getAll(page = 1, limit = 10): Promise<{ data: Expense[]; total: number; page: number; limit: number }> {
    return apiService.get(`/expenses?page=${page}&limit=${limit}`);
  },

  async getById(id: number): Promise<Expense> {
    return apiService.get(`/expenses/${id}`);
  },

  async create(data: CreateExpenseDto): Promise<Expense> {
    return apiService.post('/expenses', data);
  },

  async update(id: number, data: UpdateExpenseDto): Promise<Expense> {
    return apiService.put(`/expenses/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return apiService.delete(`/expenses/${id}`);
  },
};
