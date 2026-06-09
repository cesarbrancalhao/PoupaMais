import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WishlistTypeService } from '../src/wishlist-type/wishlist-type.service';
import { DatabaseService } from '../src/database/database.service';

describe('WishlistTypeService', () => {
  let service: WishlistTypeService;
  let databaseService: jest.Mocked<DatabaseService>;

  const mockType = {
    id: 1,
    name: 'Electronics',
    icon: 'Smartphone',
    created_at: new Date('2025-01-01'),
    user_id: 1,
  };

  beforeEach(async () => {
    const mockDatabaseService = {
      query: jest.fn(),
      getClient: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [WishlistTypeService, { provide: DatabaseService, useValue: mockDatabaseService }],
    }).compile();

    service = module.get<WishlistTypeService>(WishlistTypeService);
    databaseService = module.get(DatabaseService) as jest.Mocked<DatabaseService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a wishlist type successfully', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue({
        rows: [mockType],
        command: '',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await service.create(1, 'Electronics', 'Smartphone');

      expect(result).toEqual(mockType);
      expect(databaseService.query).toHaveBeenCalledWith(
        'INSERT INTO wishlist_type (name, icon, user_id) VALUES ($1, $2, $3) RETURNING *',
        ['Electronics', 'Smartphone', 1],
      );
    });

    it('should use default icon when not provided', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue({
        rows: [{ ...mockType, icon: 'Tag' }],
        command: '',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await service.create(1, 'Books');

      expect(result.icon).toBe('Tag');
      expect(databaseService.query).toHaveBeenCalledWith(
        'INSERT INTO wishlist_type (name, icon, user_id) VALUES ($1, $2, $3) RETURNING *',
        ['Books', 'Tag', 1],
      );
    });
  });

  describe('findAll', () => {
    it('should return all types for a user', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue({
        rows: [mockType],
        command: '',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await service.findAll(1);

      expect(result).toEqual([mockType]);
      expect(databaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM wishlist_type WHERE user_id = $1',
        [1],
      );
    });
  });

  describe('findOne', () => {
    it('should return a type by id and userId', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue({
        rows: [mockType],
        command: '',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await service.findOne(1, 1);

      expect(result).toEqual(mockType);
      expect(databaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM wishlist_type WHERE id = $1 AND user_id = $2',
        [1, 1],
      );
    });

    it('should throw NotFoundException when type is not found', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue({
        rows: [],
        command: '',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      await expect(service.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a type', async () => {
      const updatedType = { ...mockType, name: 'Updated' };
      (databaseService.query as jest.Mock).mockResolvedValue({
        rows: [updatedType],
        command: '',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await service.update(1, 1, 'Updated', 'NewIcon');

      expect(result.name).toBe('Updated');
      expect(databaseService.query).toHaveBeenCalledWith(
        'UPDATE wishlist_type SET name = $1, icon = COALESCE($2, icon) WHERE id = $3 AND user_id = $4 RETURNING *',
        ['Updated', 'NewIcon', 1, 1],
      );
    });

    it('should throw NotFoundException when type to update is not found', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue({
        rows: [],
        command: '',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      await expect(service.update(999, 1, 'Test')).rejects.toThrow(NotFoundException);
    });
  });

  describe('remove', () => {
    it('should delete a type', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue({
        rows: [],
        command: '',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await service.remove(1, 1);

      expect(result.message).toBe('Wishlist type deleted successfully');
      expect(databaseService.query).toHaveBeenCalledWith(
        'DELETE FROM wishlist_type WHERE id = $1 AND user_id = $2',
        [1, 1],
      );
    });

    it('should throw NotFoundException when type to delete is not found', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue({
        rows: [],
        command: '',
        rowCount: 0,
        oid: 0,
        fields: [],
      });

      await expect(service.remove(999, 1)).rejects.toThrow(NotFoundException);
    });
  });
});
