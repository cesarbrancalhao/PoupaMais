import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WishlistSagaService } from '../src/wishlist-saga/wishlist-saga.service';
import { DatabaseService } from '../src/database/database.service';

describe('WishlistSagaService', () => {
  let service: WishlistSagaService;
  let databaseService: jest.Mocked<DatabaseService>;

  const mockSaga = {
    id: 1,
    name: 'Youth',
    icon: 'BookOpen',
    created_at: new Date('2025-01-01'),
    user_id: 1,
  };

  beforeEach(async () => {
    const mockDatabaseService = {
      query: jest.fn(),
      getClient: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [WishlistSagaService, { provide: DatabaseService, useValue: mockDatabaseService }],
    }).compile();

    service = module.get<WishlistSagaService>(WishlistSagaService);
    databaseService = module.get(DatabaseService) as jest.Mocked<DatabaseService>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a saga successfully', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue({
        rows: [mockSaga],
        command: '',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await service.create(1, 'Youth', 'BookOpen');

      expect(result).toEqual(mockSaga);
      expect(databaseService.query).toHaveBeenCalledWith(
        'INSERT INTO wishlist_saga (name, icon, user_id) VALUES ($1, $2, $3) RETURNING *',
        ['Youth', 'BookOpen', 1],
      );
    });

    it('should use default icon when not provided', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue({
        rows: [{ ...mockSaga, icon: 'BookOpen' }],
        command: '',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await service.create(1, 'Adult');

      expect(result.icon).toBe('BookOpen');
    });
  });

  describe('findAll', () => {
    it('should return all sagas for a user', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue({
        rows: [mockSaga],
        command: '',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await service.findAll(1);

      expect(result).toEqual([mockSaga]);
      expect(databaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM wishlist_saga WHERE user_id = $1',
        [1],
      );
    });
  });

  describe('findOne', () => {
    it('should return a saga by id and userId', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue({
        rows: [mockSaga],
        command: '',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await service.findOne(1, 1);

      expect(result).toEqual(mockSaga);
    });

    it('should throw NotFoundException when saga is not found', async () => {
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
    it('should update a saga', async () => {
      const updatedSaga = { ...mockSaga, name: 'Updated' };
      (databaseService.query as jest.Mock).mockResolvedValue({
        rows: [updatedSaga],
        command: '',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await service.update(1, 1, 'Updated');

      expect(result.name).toBe('Updated');
    });

    it('should throw NotFoundException when saga to update is not found', async () => {
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
    it('should delete a saga', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue({
        rows: [],
        command: '',
        rowCount: 1,
        oid: 0,
        fields: [],
      });

      const result = await service.remove(1, 1);

      expect(result.message).toBe('Wishlist saga deleted successfully');
      expect(databaseService.query).toHaveBeenCalledWith(
        'DELETE FROM wishlist_saga WHERE id = $1 AND user_id = $2',
        [1, 1],
      );
    });

    it('should throw NotFoundException when saga to delete is not found', async () => {
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
