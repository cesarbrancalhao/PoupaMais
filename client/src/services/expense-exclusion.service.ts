import { apiService } from './api';
import { ExpenseExclusion } from '@/types';

export const expenseExclusionService = {
  async create(expenseId: number, exclusionDate: string): Promise<ExpenseExclusion> {
    return apiService.post(`/expenses/${expenseId}/exclusions`, { exclusion_date: exclusionDate });
  },

  async getAll(): Promise<ExpenseExclusion[]> {
    return apiService.get('/expenses/exclusions/all');
  },

  async delete(id: number): Promise<void> {
    return apiService.delete(`/expenses/exclusions/${id}`);
  },
};
