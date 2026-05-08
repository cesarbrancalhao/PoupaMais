import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { DatabaseService } from '../src/database/database.service';
import { QueryResult } from 'pg';

const mockPoolInstance = {
  query: jest.fn(),
  end: jest.fn(),
  connect: jest.fn(),
};

jest.mock('pg', () => ({
  Pool: jest.fn().mockImplementation(() => mockPoolInstance),
}));

describe('DatabaseService', () => {
  let service: DatabaseService;
  const voidResult = { rows: [], command: '', rowCount: 0, oid: 0, fields: [] } as QueryResult;

  beforeEach(async () => {
    const mockConfigService = {
      get: jest.fn((key: string) => {
        const config: Record<string, string | number> = {
          DB_HOST: 'localhost',
          DB_PORT: 5432,
          DB_USERNAME: 'testuser',
          DB_PASSWORD: 'testpass',
          DB_DATABASE: 'testdb',
        };
        return config[key];
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DatabaseService,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<DatabaseService>(DatabaseService);
    mockPoolInstance.query = jest.fn();
    mockPoolInstance.end = jest.fn();
    mockPoolInstance.connect = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should create a pool with config values and test connection', async () => {
      mockPoolInstance.query.mockResolvedValueOnce(voidResult);

      await service.onModuleInit();

      expect(jest.requireMock('pg').Pool).toHaveBeenCalledWith({
        host: 'localhost',
        port: 5432,
        user: 'testuser',
        password: 'testpass',
        database: 'testdb',
        max: 20,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 2000,
      });
      expect(mockPoolInstance.query).toHaveBeenCalledWith('SELECT NOW()');
    });

    it('should throw when connection fails', async () => {
      mockPoolInstance.query.mockRejectedValueOnce(new Error('Connection refused'));

      await expect(service.onModuleInit()).rejects.toThrow('Falha na conexão com o banco de dados');
    });
  });

  describe('query', () => {
    it('should delegate to pool.query and return result', async () => {
      mockPoolInstance.query.mockResolvedValueOnce(voidResult);
      await service.onModuleInit();

      const mockResult = { rows: [{ id: 1 }], rowCount: 1, command: 'SELECT', oid: 0, fields: [] } as QueryResult;
      mockPoolInstance.query.mockResolvedValueOnce(mockResult);

      const result = await service.query('SELECT * FROM users WHERE id = $1', [1]);

      expect(mockPoolInstance.query).toHaveBeenCalledWith('SELECT * FROM users WHERE id = $1', [1]);
      expect(result).toEqual(mockResult);
    });
  });

  describe('getClient', () => {
    it('should return a pool client', async () => {
      mockPoolInstance.query.mockResolvedValueOnce(voidResult);
      await service.onModuleInit();

      const mockClient = { query: jest.fn(), release: jest.fn() };
      mockPoolInstance.connect.mockResolvedValueOnce(mockClient as any);

      const client = await service.getClient();

      expect(client).toBe(mockClient);
      expect(mockPoolInstance.connect).toHaveBeenCalled();
    });
  });
});
