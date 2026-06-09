import { wishlistService } from '../wishlist.service';
import { apiService } from '../api';

jest.mock('../api', () => ({
  apiService: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('WishlistService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch wishlist items', async () => {
      const mockItems = {
        data: [{ id: 1, name: 'Laptop', price: 1500 }],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      };
      (apiService.get as jest.Mock).mockResolvedValue(mockItems);

      const result = await wishlistService.getAll(1, 20);

      expect(result).toEqual(mockItems);
      expect(apiService.get).toHaveBeenCalledWith('/wishlist?page=1&limit=20');
    });
  });

  describe('getById', () => {
    it('should fetch a single item', async () => {
      const mockItem = { id: 1, name: 'Laptop', price: 1500 };
      (apiService.get as jest.Mock).mockResolvedValue(mockItem);

      const result = await wishlistService.getById(1);

      expect(result).toEqual(mockItem);
      expect(apiService.get).toHaveBeenCalledWith('/wishlist/1');
    });
  });

  describe('create', () => {
    it('should create a new item', async () => {
      const createDto = { name: 'Laptop', price: 1500, priority: 'high' };
      (apiService.post as jest.Mock).mockResolvedValue(null);

      await wishlistService.create(createDto);

      expect(apiService.post).toHaveBeenCalledWith('/wishlist', createDto);
    });
  });

  describe('update', () => {
    it('should update an item', async () => {
      const updateDto = { name: 'Updated Laptop' };
      const mockUpdated = { id: 1, name: 'Updated Laptop', price: 1500 };
      (apiService.put as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await wishlistService.update(1, updateDto);

      expect(result).toEqual(mockUpdated);
      expect(apiService.put).toHaveBeenCalledWith('/wishlist/1', updateDto);
    });
  });

  describe('delete', () => {
    it('should delete an item', async () => {
      (apiService.delete as jest.Mock).mockResolvedValue(null);

      await wishlistService.delete(1);

      expect(apiService.delete).toHaveBeenCalledWith('/wishlist/1');
    });
  });
});
