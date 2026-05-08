import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { GoalsService } from '../src/goals/goals.service';
import { DatabaseService } from '../src/database/database.service';

describe('GoalsService', () => {
  let goalsService: GoalsService;
  let databaseService: jest.Mocked<DatabaseService>;

  const mockGoal = {
    id: 1,
    nome: 'Trip',
    descricao: 'Trip to Europe',
    valor: 5000,
    economia_mensal: 500,
    data_inicio: new Date('2025-01-01'),
    data_alvo: new Date('2025-12-31'),
    created_at: new Date('2025-01-01'),
    usuario_id: 1,
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
      providers: [
        GoalsService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();

    goalsService = module.get<GoalsService>(GoalsService);
    databaseService = module.get(DatabaseService) as jest.Mocked<DatabaseService>;

    databaseService.getClient.mockResolvedValue(mockClient as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a goal successfully', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [mockGoal] })
        .mockResolvedValueOnce(undefined);

      const result = await goalsService.create(1, {
        nome: 'Trip',
        valor: 5000,
      });

      expect(result).toEqual(mockGoal);
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should throw BadRequestException when user does not exist', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [] });

      mockClient.query.mockResolvedValueOnce(undefined); // ROLLBACK

      await expect(
        goalsService.create(999, { nome: 'Trip', valor: 5000 }),
      ).rejects.toThrow(BadRequestException);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated goals', async () => {
      (databaseService.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockGoal], command: '', rowCount: 1, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [{ count: '1' }], command: '', rowCount: 1, oid: 0, fields: [] });

      const result = await goalsService.findAll(1, 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should cap limit at 2000', async () => {
      (databaseService.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [], command: '', rowCount: 0, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }], command: '', rowCount: 1, oid: 0, fields: [] });

      await goalsService.findAll(1, 1, 5000);

      const calls = databaseService.query.mock.calls;
      expect(calls[0][1][1]).toBe(2000);
    });
  });

  describe('findOne', () => {
    it('should return a goal by id and userId', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue({ rows: [mockGoal], command: '', rowCount: 1, oid: 0, fields: [] });

      const result = await goalsService.findOne(1, 1);

      expect(result).toEqual(mockGoal);
      expect(databaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM meta WHERE id = $1 AND usuario_id = $2',
        [1, 1],
      );
    });

    it('should throw NotFoundException when goal is not found', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue({ rows: [], command: '', rowCount: 0, oid: 0, fields: [] });

      await expect(goalsService.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a goal', async () => {
      const updatedGoal = { ...mockGoal, nome: 'Updated Trip' };

      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [updatedGoal] })
        .mockResolvedValueOnce(undefined);

      const result = await goalsService.update(1, 1, { nome: 'Updated Trip' });

      expect(result.nome).toBe('Updated Trip');
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should throw NotFoundException when goal to update is not found', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [] });

      mockClient.query.mockResolvedValueOnce(undefined); // ROLLBACK

      await expect(
        goalsService.update(999, 1, { nome: 'Test' }),
      ).rejects.toThrow(NotFoundException);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('remove', () => {
    it('should delete a goal', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue({ rows: [], command: '', rowCount: 1, oid: 0, fields: [] });

      const result = await goalsService.remove(1, 1);

      expect(result.message).toBe('Goal deleted successfully');
    });

    it('should throw NotFoundException when goal to delete is not found', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue({ rows: [], command: '', rowCount: 0, oid: 0, fields: [] });

      await expect(goalsService.remove(999, 1)).rejects.toThrow(NotFoundException);
    });
  });
});
