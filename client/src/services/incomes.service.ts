import { apiService } from './api';
import { Income, CreateIncomeDto, UpdateIncomeDto } from '@/types';

export const incomesService = {
  async getAll(page = 1, limit = 10): Promise<{ data: Income[]; total: number; page: number; limit: number }> {
    return apiService.get(`/incomes?page=${page}&limit=${limit}`);
  },

  async getById(id: number): Promise<Income> {
    return apiService.get(`/incomes/${id}`);
  },

  async create(data: CreateIncomeDto): Promise<Income> {
    return apiService.post('/incomes', data);
  },

  async update(id: number, data: UpdateIncomeDto): Promise<Income> {
    return apiService.put(`/incomes/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return apiService.delete(`/incomes/${id}`);
  },
};
