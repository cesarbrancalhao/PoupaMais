import { apiService } from './api';
import { GoalContribution, CreateGoalContributionDto, UpdateGoalContributionDto } from '@/types';

export const goalContributionService = {
  async getAll(page = 1, limit = 100): Promise<{ data: GoalContribution[]; total: number; page: number; limit: number }> {
    return apiService.get(`/goal-contribution?page=${page}&limit=${limit}`);
  },

  async getAllByGoal(goalId: number, page = 1, limit = 100): Promise<{ data: GoalContribution[]; total: number; page: number; limit: number }> {
    return apiService.get(`/goal-contribution/goal/${goalId}?page=${page}&limit=${limit}`);
  },

  async getById(id: number): Promise<GoalContribution> {
    return apiService.get(`/goal-contribution/${id}`);
  },

  async create(data: CreateGoalContributionDto): Promise<GoalContribution> {
    return apiService.post('/goal-contribution', data);
  },

  async update(id: number, data: UpdateGoalContributionDto): Promise<GoalContribution> {
    return apiService.put(`/goal-contribution/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return apiService.delete(`/goal-contribution/${id}`);
  },
};
