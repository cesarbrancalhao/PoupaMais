import { wishlistSagaService } from '../wishlist-sagas.service';
import { apiService } from '../api';

jest.mock('../api', () => ({
  apiService: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('WishlistSagaService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all wishlist sagas', async () => {
      const mockSagas = [{ id: 1, name: 'Youth', icon: 'BookOpen' }];
      (apiService.get as jest.Mock).mockResolvedValue(mockSagas);

      const result = await wishlistSagaService.getAll();

      expect(result).toEqual(mockSagas);
      expect(apiService.get).toHaveBeenCalledWith('/wishlist-saga');
    });
  });

  describe('getById', () => {
    it('should fetch a single saga', async () => {
      const mockSaga = { id: 1, name: 'Youth', icon: 'BookOpen' };
      (apiService.get as jest.Mock).mockResolvedValue(mockSaga);

      const result = await wishlistSagaService.getById(1);

      expect(result).toEqual(mockSaga);
      expect(apiService.get).toHaveBeenCalledWith('/wishlist-saga/1');
    });
  });

  describe('create', () => {
    it('should create a new saga', async () => {
      const createDto = { name: 'Adult', icon: 'Briefcase' };
      (apiService.post as jest.Mock).mockResolvedValue(null);

      await wishlistSagaService.create(createDto);

      expect(apiService.post).toHaveBeenCalledWith('/wishlist-saga', createDto);
    });
  });

  describe('update', () => {
    it('should update a saga', async () => {
      const updateDto = { name: 'Updated' };
      const mockUpdated = { id: 1, name: 'Updated', icon: 'BookOpen' };
      (apiService.put as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await wishlistSagaService.update(1, updateDto);

      expect(result).toEqual(mockUpdated);
      expect(apiService.put).toHaveBeenCalledWith('/wishlist-saga/1', updateDto);
    });
  });

  describe('delete', () => {
    it('should delete a saga', async () => {
      (apiService.delete as jest.Mock).mockResolvedValue(null);

      await wishlistSagaService.delete(1);

      expect(apiService.delete).toHaveBeenCalledWith('/wishlist-saga/1');
    });
  });
});
