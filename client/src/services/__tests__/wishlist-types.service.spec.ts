import { wishlistTypeService } from '../wishlist-types.service';
import { apiService } from '../api';

jest.mock('../api', () => ({
  apiService: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('WishlistTypeService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getAll', () => {
    it('should fetch all wishlist types', async () => {
      const mockTypes = [{ id: 1, name: 'Electronics', icon: 'Smartphone' }];
      (apiService.get as jest.Mock).mockResolvedValue(mockTypes);

      const result = await wishlistTypeService.getAll();

      expect(result).toEqual(mockTypes);
      expect(apiService.get).toHaveBeenCalledWith('/wishlist-type');
    });
  });

  describe('getById', () => {
    it('should fetch a single wishlist type', async () => {
      const mockType = { id: 1, name: 'Electronics', icon: 'Smartphone' };
      (apiService.get as jest.Mock).mockResolvedValue(mockType);

      const result = await wishlistTypeService.getById(1);

      expect(result).toEqual(mockType);
      expect(apiService.get).toHaveBeenCalledWith('/wishlist-type/1');
    });
  });

  describe('create', () => {
    it('should create a new wishlist type', async () => {
      const createDto = { name: 'Books', icon: 'Book' };
      (apiService.post as jest.Mock).mockResolvedValue(null);

      await wishlistTypeService.create(createDto);

      expect(apiService.post).toHaveBeenCalledWith('/wishlist-type', createDto);
    });
  });

  describe('update', () => {
    it('should update a wishlist type', async () => {
      const updateDto = { name: 'Updated' };
      const mockUpdated = { id: 1, name: 'Updated', icon: 'Smartphone' };
      (apiService.put as jest.Mock).mockResolvedValue(mockUpdated);

      const result = await wishlistTypeService.update(1, updateDto);

      expect(result).toEqual(mockUpdated);
      expect(apiService.put).toHaveBeenCalledWith('/wishlist-type/1', updateDto);
    });
  });

  describe('delete', () => {
    it('should delete a wishlist type', async () => {
      (apiService.delete as jest.Mock).mockResolvedValue(null);

      await wishlistTypeService.delete(1);

      expect(apiService.delete).toHaveBeenCalledWith('/wishlist-type/1');
    });
  });
});
