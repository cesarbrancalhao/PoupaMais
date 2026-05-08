import { apiService } from './api';
import { IncomeExclusion } from '@/types';

export const incomeExclusionService = {
  async create(incomeId: number, exclusionDate: string): Promise<IncomeExclusion> {
    return apiService.post(`/incomes/${incomeId}/exclusions`, { data_exclusao: exclusionDate });
  },

  async getAll(): Promise<IncomeExclusion[]> {
    return apiService.get('/incomes/exclusions/all');
  },

  async delete(id: number): Promise<void> {
    return apiService.delete(`/incomes/exclusions/${id}`);
  },
};
