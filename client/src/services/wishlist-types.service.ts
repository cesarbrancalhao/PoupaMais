import { apiService } from './api';
import { WishlistType, CreateWishlistTypeDto, UpdateWishlistTypeDto } from '@/types';

export const wishlistTypeService = {
  async getAll(): Promise<WishlistType[]> {
    return apiService.get('/wishlist-type');
  },

  async getById(id: number): Promise<WishlistType> {
    return apiService.get(`/wishlist-type/${id}`);
  },

  async create(data: CreateWishlistTypeDto): Promise<WishlistType> {
    return apiService.post('/wishlist-type', data);
  },

  async update(id: number, data: UpdateWishlistTypeDto): Promise<WishlistType> {
    return apiService.put(`/wishlist-type/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return apiService.delete(`/wishlist-type/${id}`);
  },
};
