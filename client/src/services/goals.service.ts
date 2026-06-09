import { apiService } from './api';
import { Goal, CreateGoalDto, UpdateGoalDto } from '@/types';

export const goalsService = {
  async getAll(page = 1, limit = 100): Promise<{ data: Goal[]; total: number; page: number; limit: number }> {
    return apiService.get(`/goals?page=${page}&limit=${limit}`);
  },

  async getById(id: number): Promise<Goal> {
    return apiService.get(`/goals/${id}`);
  },

  async create(data: CreateGoalDto): Promise<Goal> {
    return apiService.post('/goals', data);
  },

  async update(id: number, data: UpdateGoalDto): Promise<Goal> {
    return apiService.put(`/goals/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return apiService.delete(`/goals/${id}`);
  },
};
