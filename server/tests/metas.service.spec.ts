import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { MetasService } from '../src/metas/metas.service';
import { DatabaseService } from '../src/database/database.service';

describe('MetasService', () => {
  let metasService: MetasService;
  let databaseService: jest.Mocked<DatabaseService>;

  const mockMeta = {
    id: 1,
    nome: 'Viagem',
    descricao: 'Viagem para Europa',
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
        MetasService,
        { provide: DatabaseService, useValue: mockDatabaseService },
      ],
    }).compile();

    metasService = module.get<MetasService>(MetasService);
    databaseService = module.get(DatabaseService) as jest.Mocked<DatabaseService>;

    databaseService.getClient.mockResolvedValue(mockClient as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a meta successfully', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [{ id: 1 }] })
        .mockResolvedValueOnce({ rows: [mockMeta] })
        .mockResolvedValueOnce(undefined);

      const result = await metasService.create(1, {
        nome: 'Viagem',
        valor: 5000,
      });

      expect(result).toEqual(mockMeta);
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
        metasService.create(999, { nome: 'Viagem', valor: 5000 }),
      ).rejects.toThrow(BadRequestException);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    it('should return paginated metas', async () => {
      (databaseService.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockMeta], command: '', rowCount: 1, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [{ count: '1' }], command: '', rowCount: 1, oid: 0, fields: [] });

      const result = await metasService.findAll(1, 1, 20);

      expect(result.data).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
      expect(result.pagination.page).toBe(1);
      expect(result.pagination.totalPages).toBe(1);
    });

    it('should cap limit at 2000', async () => {
      (databaseService.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [], command: '', rowCount: 0, oid: 0, fields: [] })
        .mockResolvedValueOnce({ rows: [{ count: '0' }], command: '', rowCount: 1, oid: 0, fields: [] });

      await metasService.findAll(1, 1, 5000);

      const calls = databaseService.query.mock.calls;
      expect(calls[0][1][1]).toBe(2000);
    });
  });

  describe('findOne', () => {
    it('should return a meta by id and userId', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue({ rows: [mockMeta], command: '', rowCount: 1, oid: 0, fields: [] });

      const result = await metasService.findOne(1, 1);

      expect(result).toEqual(mockMeta);
      expect(databaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM meta WHERE id = $1 AND usuario_id = $2',
        [1, 1],
      );
    });

    it('should throw NotFoundException when meta is not found', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue({ rows: [], command: '', rowCount: 0, oid: 0, fields: [] });

      await expect(metasService.findOne(999, 1)).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a meta', async () => {
      const updatedMeta = { ...mockMeta, nome: 'Viagem Atualizada' };

      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [updatedMeta] })
        .mockResolvedValueOnce(undefined);

      const result = await metasService.update(1, 1, { nome: 'Viagem Atualizada' });

      expect(result.nome).toBe('Viagem Atualizada');
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
    });

    it('should throw NotFoundException when meta to update is not found', async () => {
      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [] });

      mockClient.query.mockResolvedValueOnce(undefined); // ROLLBACK

      await expect(
        metasService.update(999, 1, { nome: 'Teste' }),
      ).rejects.toThrow(NotFoundException);

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });
  });

  describe('remove', () => {
    it('should delete a meta', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue({ rows: [], command: '', rowCount: 1, oid: 0, fields: [] });

      const result = await metasService.remove(1, 1);

      expect(result.message).toBe('Meta excluída com sucesso');
    });

    it('should throw NotFoundException when meta to delete is not found', async () => {
      (databaseService.query as jest.Mock).mockResolvedValue({ rows: [], command: '', rowCount: 0, oid: 0, fields: [] });

      await expect(metasService.remove(999, 1)).rejects.toThrow(NotFoundException);
    });
  });
});
