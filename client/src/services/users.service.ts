import { apiService } from './api';
import { User, Language, Currency } from '@/types/auth';

export const usersService = {
  async getProfile(): Promise<User> {
    return apiService.get('/users/profile');
  },

  async updateProfile(name: string, email: string): Promise<User> {
    return apiService.put('/users/profile', { name, email });
  },

  async updateSettings(language: Language, currency: Currency): Promise<User> {
    return apiService.put('/users/settings', { language, currency });
  },

  async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    return apiService.put('/users/change-password', { currentPassword, newPassword });
  },
};
