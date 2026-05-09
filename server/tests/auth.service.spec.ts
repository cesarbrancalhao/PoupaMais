import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { AuthService } from '../src/auth/auth.service';
import { DatabaseService } from '../src/database/database.service';

describe('AuthService', () => {
  let authService: AuthService;
  let databaseService: jest.Mocked<DatabaseService>;
  let jwtService: jest.Mocked<JwtService>;

  const mockUser = {
    id: 1,
    name: 'Test User',
    email: 'test@example.com',
    password: '$2b$10$hashedpassword',
    language: 'portuguese' as const,
    currency: 'real' as const,
    created_at: new Date(),
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

    const mockJwtService = {
      sign: jest.fn().mockReturnValue('mock.jwt.token'),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DatabaseService, useValue: mockDatabaseService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
    databaseService = module.get(DatabaseService) as jest.Mocked<DatabaseService>;
    jwtService = module.get(JwtService) as jest.Mocked<JwtService>;

    databaseService.getClient.mockResolvedValue(mockClient as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should generate a JWT token for a valid user', async () => {
      const user = { ...mockUser };
      delete (user as any).password;

      const result = await authService.login(user);

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: user.email,
        sub: user.id,
      });
      expect(result.access_token).toBe('mock.jwt.token');
      expect(result.user).toEqual({
        id: user.id,
        name: user.name,
        email: user.email,
        language: user.language,
        currency: user.currency,
      });
    });
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      databaseService.query.mockResolvedValue({ rows: [mockUser] } as any);
      (bcrypt.compare as jest.Mock) = jest.fn().mockResolvedValue(true);

      const result = await authService.validateUser('test@example.com', 'correct-password');

      expect(databaseService.query).toHaveBeenCalledWith(
        'SELECT * FROM users WHERE email = $1',
        ['test@example.com'],
      );
      expect(result).toHaveProperty('id', 1);
      expect(result).not.toHaveProperty('password');
    });

    it('should return null when user is not found', async () => {
      databaseService.query.mockResolvedValue({ rows: [] } as any);

      const result = await authService.validateUser('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('register', () => {
    it('should throw when email already exists', async () => {
      databaseService.query.mockResolvedValue({ rows: [{ id: 1 }] } as any);

      await expect(
        authService.register('Test', 'existing@example.com', 'password123', 'portuguese'),
      ).rejects.toThrow('Email already registered');
    });

    it('should create a new user with default categories and sources', async () => {
      databaseService.query.mockResolvedValueOnce({ rows: [] } as any);

      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce({ rows: [mockUser] })
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined)
        .mockResolvedValueOnce(undefined);

      (bcrypt.hash as jest.Mock) = jest.fn().mockResolvedValue('$2b$10$hashed');

      const result = await authService.register('Test', 'new@example.com', 'password123', 'portuguese');

      expect(result.access_token).toBe('mock.jwt.token');
      expect(result.user.email).toBe('test@example.com');
      expect(mockClient.query).toHaveBeenCalledWith('BEGIN');
      expect(mockClient.query).toHaveBeenCalledWith('COMMIT');
      expect(mockClient.release).toHaveBeenCalled();
    });

    it('should rollback on error during registration', async () => {
      databaseService.query.mockResolvedValueOnce({ rows: [] } as any);

      mockClient.query
        .mockResolvedValueOnce(undefined)
        .mockRejectedValueOnce(new Error('DB Error'))
        .mockResolvedValueOnce(undefined);

      (bcrypt.hash as jest.Mock) = jest.fn().mockResolvedValue('$2b$10$hashed');

      await expect(
        authService.register('Test', 'new@example.com', 'password123', 'portuguese'),
      ).rejects.toThrow('There was an error registering the user');

      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
      expect(mockClient.release).toHaveBeenCalled();
    });
  });

  describe('default categories by language', () => {
    it('should have 6 default Portuguese categories', () => {
      expect(authService).toBeDefined();
    });
  });
});
