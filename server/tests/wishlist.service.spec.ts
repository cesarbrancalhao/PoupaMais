import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { WishlistService } from '../src/wishlist/wishlist.service';
import { DatabaseService } from '../src/database/database.service';

describe('WishlistService', () => {
  let wishlistService: WishlistService;
  let databaseService: jest.Mocked<DatabaseService>;

  const mockItem = {
    id: 1,
    name: 'New Laptop',
    price: 1500.0,
    checked: false,
    priority: 'medium',
    quarter: 'Q1',
    wishlist_type_id: null,
    saga_id: null,
    created_at: new Date('2025-01-01'),
    user_id: 1,
  };

  const mockClient = {
    query: jest.fn(),
    release: jest.fn(),
  };

  beforeEach(async () => {
    const mockDatabaseService = {
      query: jest.fn(),
      getClient: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [WishlistService, { provide: DatabaseService, useValue: mockDatabaseService }],
    }).compile();

    wishlistService = module.get<WishlistService>(WishlistService);
    databaseService = module.get(DatabaseService) as jest.Mocked<DatabaseService>;

    databaseService.getClient.mockResolvedValue(mockClient as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a wishlist item successfully', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [mockItem] })
        .mockResolvedValueOnce(undefined);

      const result = await wishlistService.create(1, {
        name: 'New Laptop',
        price: 1500,
      });

      expect(result).toEqual(mockItem);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException when user does not exist', async () => {
      mockClient.query.mockResolvedValueOnce(undefined).mockResolvedValueOnce({ rows: [] });

      mockClient.query.mockResolvedValueOnce(undefined);

      await expect(wishlistService.create(999, { name: 'Test', price: 100 })).rejects.toThrow(
        BadRequestException,
      );

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated items', async () => {
      (databaseService.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockItem], command: '', rowCount: 1, oid: 0, fields: [] })
        .mockResolvedValueOnce({
          rows: [{ count: '1' }],
          command: '',
          rowCount: 1,
          oid: 0,
          fields: [],
        });

      const result = await wishlistService.findAll(1, 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should cap limit at 2000', async () => {
      (databaseService.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [], command: '', rowCount: 0, oid: 0, fields: [] })
        .mockResolvedValueOnce({
          rows: [{ count: '0' }],
          command: '',
          rowCount: 1,
          oid: 0,
          fields: [],
        });

      await wishlistService.findAll(1, 1, 5000);

      const calls = (databaseService.query as jest.Mock).mock.calls;
      expect(calls[0][1][1]).toBe(2000);
    });
  });

  describe('findOne', () => {
    it('should return an item by id and userId', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue({
        rows: [mockItem],
        command: '',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await wishlistService.findOne(1, 1);

      expect(result).toEqual(mockItem);
      expect(databaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM wishlist WHERE id = $1 AND user_id = $2',
        [1, 1],
      );
    });

    it('should throw NotFoundException when item is not found', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue({
        rows: [],
        command: '',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      await expect(wishlistService.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update an item', async () => {
      const updatedItem = { ...mockItem, name: 'Updated Laptop' };

      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [updatedItem] })
        .mockResolvedValueOnce(undefined);

      const result = await wishlistService.update(1, 1, { name: 'Updated Laptop' });

      expect(result.name).toBe('Updated Laptop');
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should throw NotFoundException when item to update is not found', async () => {
      mockClient.query.mockResolvedValueOnce(undefined).mockResolvedValueOnce({ rows: [] });

      mockClient.query.mockResolvedValueOnce(undefined);

      await expect(wishlistService.update(999, 1, { name: 'Test' })).rejects.toThrow(
        NotFoundException,
      );

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('remove', () => {
    it('should delete an item', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue({
        rows: [],
        command: '',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await wishlistService.remove(1, 1);

      expect(result.message).toBe('Wishlist item deleted successfully');
    });

    it('should throw NotFoundException when item to delete is not found', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue({
        rows: [],
        command: '',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      await expect(wishlistService.remove(999, 1)).rejects.toThrow(NotFoundException);
    });
  });
});
