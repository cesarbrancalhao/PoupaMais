import { apiService } from './api';
import { IncomeSource, CreateIncomeSourceDto, UpdateIncomeSourceDto } from '@/types';

export const incomeSourcesService = {
  async getAll(): Promise<IncomeSource[]> {
    return apiService.get('/income-source');
  },

  async getById(id: number): Promise<IncomeSource> {
    return apiService.get(`/income-source/${id}`);
  },

  async create(data: CreateIncomeSourceDto): Promise<IncomeSource> {
    return apiService.post('/income-source', data);
  },

  async update(id: number, data: UpdateIncomeSourceDto): Promise<IncomeSource> {
    return apiService.put(`/income-source/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return apiService.delete(`/income-source/${id}`);
  },
};
