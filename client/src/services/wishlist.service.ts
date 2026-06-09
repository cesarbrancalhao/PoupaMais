import { apiService } from './api';
import { WishlistItem, CreateWishlistDto, UpdateWishlistDto } from '@/types';

export const wishlistService = {
  async getAll(page = 1, limit = 2000): Promise<{ data: WishlistItem[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    return apiService.get(`/wishlist?page=${page}&limit=${limit}`);
  },

  async getById(id: number): Promise<WishlistItem> {
    return apiService.get(`/wishlist/${id}`);
  },

  async create(data: CreateWishlistDto): Promise<WishlistItem> {
    return apiService.post('/wishlist', data);
  },

  async update(id: number, data: UpdateWishlistDto): Promise<WishlistItem> {
    return apiService.put(`/wishlist/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return apiService.delete(`/wishlist/${id}`);
  },
};
