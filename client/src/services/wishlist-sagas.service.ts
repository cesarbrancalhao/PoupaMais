import { apiService } from './api';
import { WishlistSaga, CreateWishlistSagaDto, UpdateWishlistSagaDto } from '@/types';

export const wishlistSagaService = {
  async getAll(): Promise<WishlistSaga[]> {
    return apiService.get('/wishlist-saga');
  },

  async getById(id: number): Promise<WishlistSaga> {
    return apiService.get(`/wishlist-saga/${id}`);
  },

  async create(data: CreateWishlistSagaDto): Promise<WishlistSaga> {
    return apiService.post('/wishlist-saga', data);
  },

  async update(id: number, data: UpdateWishlistSagaDto): Promise<WishlistSaga> {
    return apiService.put(`/wishlist-saga/${id}`, data);
  },

  async delete(id: number): Promise<void> {
    return apiService.delete(`/wishlist-saga/${id}`);
  },
};
